
from fastapi import APIRouter, HTTPException
from uuid import uuid4
from api.schemas import WorkflowExecutionRequest, WorkflowExecutionResponse, Workflow
from core.workflow_runner import run_workflow

router = APIRouter()

@router.post("/execute", response_model=WorkflowExecutionResponse)
async def execute_workflow(request: WorkflowExecutionRequest):
    """
    Bir workflow tanımını alır, çalıştırır ve sonucunu döndürür.
    Stateful (hafızalı) oturumlar için, request body içinde bir `workflow_id` gönderilebilir.
    Eğer gönderilmezse, her seferinde yeni bir oturum başlatılır.
    """
    workflow_def = request.workflow
    input_text = request.input.get("input", "")
    
    # Eğer bir workflow_id gelmediyse, bu tek seferlik bir çalıştırmadır.
    # Stateful (hafızalı) bir oturum için client'ın aynı id'yi göndermesi gerekir.
    workflow_id = request.workflow_id or f"session_{uuid4()}"

    try:
        result = await run_workflow(
            workflow_def=workflow_def, 
            input_text=input_text, 
            workflow_id=workflow_id
        )
        return WorkflowExecutionResponse(output=result, workflow_id=workflow_id)

    except Exception as e:
        # Hata ayıklama için loglama yapmak iyi bir pratik olacaktır.
        print(f"Error during workflow execution: {e}")
        raise HTTPException(status_code=500, detail=str(e))
