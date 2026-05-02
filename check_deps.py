import sys
print(f"Python: {sys.version}")

deps = ["fastapi", "uvicorn", "torch", "rdkit"]
for dep in deps:
    try:
        __import__(dep)
        print(f"OK: {dep}")
    except ImportError as e:
        print(f"MISSING: {dep} -> {e}")
