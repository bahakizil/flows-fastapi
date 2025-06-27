import importlib
import inspect
from pathlib import Path
from typing import Dict, Type
from nodes.base import BaseNode

NODE_TYPE_MAP: Dict[str, Type[BaseNode]] = {}

def discover_nodes():
    """`nodes` klasörünü tarar ve BaseNode'dan türeyen tüm sınıfları bulur."""
    if NODE_TYPE_MAP: # Sadece bir kez çalıştır
        return

    nodes_dir = Path(__file__).parent.parent / "nodes"
    for path in nodes_dir.rglob("*.py"): # Tüm alt klasörleri tara
        if path.name == "__init__.py" or path.name == "base.py":
            continue

        # Dosya yolunu Python import yoluna çevir (örn: nodes.llms.openai)
        rel_path = path.relative_to(nodes_dir.parent)
        parts = list(rel_path.parts)
        if parts[-1].endswith('.py'):
            parts[-1] = parts[-1][:-3]  # Remove .py extension correctly
        module_path = ".".join(parts)
        
        try:
            module = importlib.import_module(module_path)
            for name, obj in inspect.getmembers(module, inspect.isclass):
                if (issubclass(obj, BaseNode) and 
                    obj is not BaseNode and 
                    not inspect.isabstract(obj)):
                    # Sınıfın metadata'sından name'i al
                    try:
                        instance = obj()
                        node_id = instance.metadata.name if hasattr(instance, 'metadata') else None
                        if not node_id:
                            continue
                        NODE_TYPE_MAP[node_id] = obj
                        print(f"Discovered Node: {node_id} -> {obj.__name__}")
                    except Exception as e:
                        print(f"Error instantiating node {obj.__name__}: {e}")
        except Exception as e:
            print(f"Error discovering node in {path}: {e}")

def get_node_class(node_type: str) -> Type[BaseNode]:
    """Verilen node tipine karşılık gelen sınıfı döndürür."""
    if not NODE_TYPE_MAP:
        discover_nodes()
    
    node_class = NODE_TYPE_MAP.get(node_type)
    if not node_class:
        raise ValueError(f"Bilinmeyen node tipi: {node_type}")
    return node_class

def get_registry() -> Dict[str, Type[BaseNode]]:
    """Returns the node registry (node type map)"""
    if not NODE_TYPE_MAP:
        discover_nodes()
    return NODE_TYPE_MAP.copy()
