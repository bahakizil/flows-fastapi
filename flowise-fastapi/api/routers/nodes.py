from fastapi import APIRouter
from typing import List, Dict, Any
from core.node_discovery import NODE_TYPE_MAP, discover_nodes

router = APIRouter()

@router.get("", response_model=List[Dict[str, Any]])
def list_nodes():
    """
    Sistemde mevcut olan tüm node'ların bir listesini döndürür.
    Her node, frontend'in UI oluşturmak için ihtiyaç duyduğu metadata'yı içerir.
    """
    # Node'ların keşfedildiğinden emin ol
    if not NODE_TYPE_MAP:
        discover_nodes()

    node_list = []
    for node_id, node_class in NODE_TYPE_MAP.items():
        try:
            instance = node_class()
            node_list.append({
                "name": getattr(instance, "name", node_id),
                "label": getattr(instance, "label", node_id),
                "description": getattr(instance, "description", ""),
                "category": getattr(instance, "category", "other"),
                "inputs": [param.dict() for param in getattr(instance, "inputs", [])],
                "outputs": [output.dict() for output in getattr(instance, "outputs", [])],
                "node_type": getattr(instance, "type", "provider")
            })
        except Exception as e:
            print(f"Error getting metadata for {node_id}: {e}")
    
    return node_list
