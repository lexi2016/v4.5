"""Read-only audit of the fixed Git source tree and its editable API web candidate.

The original materializer intentionally hashes current paths. After candidate
edits, use this explicit Git-tree audit; never modify frozen matrices to make
candidate bytes masquerade as original sources.
"""
from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path, PurePosixPath

BASE = "530beea8f3c3edd082d777cbe316b4b0322080ee"
ENTRY = "docs/source-baseline-20261112"
REPO = Path(__file__).resolve().parents[2]
EDITABLE_INTEGRATION = {"apps/web/index.html", "apps/web/vite.config.ts"}


def safe_relative(value: str) -> str:
    path = PurePosixPath(value)
    if (not value or path.is_absolute() or ".." in path.parts or ".git" in path.parts
            or "\\" in value or any(ord(c) < 32 for c in value)):
        raise ValueError(f"Unsafe matrix path: {value}")
    return value


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", *args], cwd=REPO)


def read_git(path: str) -> bytes:
    return git("show", f"{BASE}:{safe_relative(path)}")


def digest(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def main() -> None:
    # Include staged and unstaged candidate edits in the frozen-tree guard.
    if git("diff", "--name-only", BASE, "--", ENTRY).strip():
        raise ValueError("Frozen source tree differs from fixed baseline")
    matrix = json.loads(read_git(f"{ENTRY}/SOURCE_MATRIX.json"))
    references = []
    for role, metadata in matrix["roles"].items():
        raw = read_git(f"{ENTRY}/{safe_relative(metadata['matrix_path'])}")
        if digest(raw) != metadata["sha256"]:
            raise ValueError(f"Role matrix SHA drift: {role}")
        selected = json.loads(raw)["selected"]
        if len(selected) != metadata["selected_count"]:
            raise ValueError(f"Role count mismatch: {role}")
        for row in selected:
            safe_relative(row["path"])
            safe_relative(row["repository_path"])
            references.append((role, row))
    paths = sorted({row["repository_path"] for _, row in references})
    query = "".join(f"{BASE}:{path}\n" for path in paths).encode()
    batch = subprocess.run(["git", "cat-file", "--batch"], input=query,
                           stdout=subprocess.PIPE, cwd=REPO, check=True).stdout
    position, observed = 0, {}
    for path in paths:
        end = batch.index(b"\n", position)
        header = batch[position:end].split()
        if len(header) != 3 or header[1] != b"blob":
            raise ValueError(f"Missing or non-blob source: {path}")
        size = int(header[2])
        start = end + 1
        payload = batch[start:start + size]
        if len(payload) != size or batch[start + size:start + size + 1] != b"\n":
            raise ValueError(f"Invalid batch framing: {path}")
        observed[path] = (digest(payload), size)
        position = start + size + 1
    exact_api_web, integration = 0, []
    for role, row in references:
        if observed[row["repository_path"]] != (row["sha256"], row["bytes"]):
            raise ValueError(f"Frozen source mismatch: {role}: {row['repository_path']}")
        if role != "API" or not row["path"].startswith("apps/web/"):
            continue
        path = REPO / row["path"]
        actual = digest(path.read_bytes()) if path.is_file() else None
        if actual == row["sha256"]:
            exact_api_web += 1
        elif row["path"] in EDITABLE_INTEGRATION:
            integration.append({"path": row["path"], "api_sha256": row["sha256"],
                                "candidate_sha256": actual})
        else:
            raise ValueError(f"Unexpected API web candidate drift: {row['path']}")
    print(json.dumps({"status": "FROZEN_GIT_TREE_SHA_MATCH", "baseline_commit": BASE,
                      "roles": len(matrix["roles"]), "references": len(references),
                      "unique_repository_paths": len(paths), "exact_api_web_files": exact_api_web,
                      "explicit_additive_integration_files": integration}, indent=2))


if __name__ == "__main__":
    main()
