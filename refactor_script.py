import os
import shutil

BASE_DIR = r"d:\rag\backend"

dirs_to_create = [
    "api",
    "services",
    "repositories",
    "core",
    "config",
    "middleware",
    "models",
    "schemas",
    "utils",
    "prompts",
    "tests"
]

for d in dirs_to_create:
    os.makedirs(os.path.join(BASE_DIR, d), exist_ok=True)
    with open(os.path.join(BASE_DIR, d, "__init__.py"), "w") as f:
        pass

print("Directories created.")
