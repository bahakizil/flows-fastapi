from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import json
import asyncio
from typing import Dict, Any

from src.models.workflow import ChatFlowManager

# Create blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

# Global flow manager instance
flow_manager = ChatFlowManager()

@api_bp.route('/nodes', methods=['GET'])
@cross_origin()
def get_available_nodes():
    """Get all available node types"""
    try:
        nodes = flow_manager.get_available_nodes()
        return jsonify({
            "success": True,
            "data": nodes
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/chatflows', methods=['POST'])
@cross_origin()
def create_chatflow():
    """Create a new chatflow"""
    try:
        flow_data = request.get_json()
        
        if not flow_data:
            return jsonify({
                "success": False,
                "error": "No flow data provided"
            }), 400
        
        flow_id = flow_manager.create_flow(flow_data)
        
        return jsonify({
            "success": True,
            "data": {
                "id": flow_id,
                "message": "Chatflow created successfully"
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/chatflows/<flow_id>', methods=['GET'])
@cross_origin()
def get_chatflow(flow_id: str):
    """Get chatflow by ID"""
    try:
        flow = flow_manager.get_flow(flow_id)
        
        if not flow:
            return jsonify({
                "success": False,
                "error": f"Chatflow {flow_id} not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": {
                "id": flow.id,
                "name": flow.name,
                "flowData": json.loads(flow.flowData)
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/chatflows/<flow_id>/validate', methods=['POST'])
@cross_origin()
def validate_chatflow(flow_id: str):
    """Validate a chatflow"""
    try:
        validation_result = flow_manager.validate_flow(flow_id)
        
        return jsonify({
            "success": True,
            "data": validation_result
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/prediction/<flow_id>', methods=['POST'])
@cross_origin()
def execute_prediction(flow_id: str):
    """Execute a chatflow prediction"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No input data provided"
            }), 400
        
        input_text = data.get('question', '')
        session_id = data.get('sessionId')
        
        if not input_text:
            return jsonify({
                "success": False,
                "error": "Question is required"
            }), 400
        
        # Create session if not provided
        if not session_id:
            session_id = flow_manager.create_session()
        
        # Execute flow asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                flow_manager.execute_flow(flow_id, input_text, session_id)
            )
        finally:
            loop.close()
        
        # Check for execution errors
        if "error" in result:
            return jsonify({
                "success": False,
                "error": result["error"]
            }), 500
        
        # Extract response text from result
        response_text = ""
        if result.get("result"):
            if isinstance(result["result"], dict):
                response_text = result["result"].get("response", str(result["result"]))
            else:
                response_text = str(result["result"])
        
        return jsonify({
            "success": True,
            "data": {
                "text": response_text,
                "sessionId": session_id,
                "executionOrder": result.get("execution_order", []),
                "fullResult": result.get("result")
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/sessions', methods=['POST'])
@cross_origin()
def create_session():
    """Create a new chat session"""
    try:
        data = request.get_json() or {}
        session_id = data.get('sessionId')
        
        session_id = flow_manager.create_session(session_id)
        
        return jsonify({
            "success": True,
            "data": {
                "sessionId": session_id
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/sessions/<session_id>', methods=['GET'])
@cross_origin()
def get_session(session_id: str):
    """Get session by ID"""
    try:
        session = flow_manager.get_session(session_id)
        
        if not session:
            return jsonify({
                "success": False,
                "error": f"Session {session_id} not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": session
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@api_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({
        "success": True,
        "data": {
            "status": "healthy",
            "service": "Flowise Backend",
            "version": "1.0.0"
        }
    })

# Example flow creation endpoint for testing
@api_bp.route('/examples/simple-chat', methods=['POST'])
@cross_origin()
def create_example_flow():
    """Create an example simple chat flow"""
    try:
        example_flow = {
            "id": "simple_chat_example",
            "name": "Simple Chat Example",
            "nodes": [
                {
                    "id": "promptTemplate_0",
                    "type": "promptTemplate",
                    "data": {
                        "inputs": {
                            "template": "Sen yardımcı bir AI asistanısın. Kullanıcı sorusu: {input}"
                        },
                        "outputs": {}
                    },
                    "position": {"x": 100, "y": 100}
                },
                {
                    "id": "chatOpenAI_0",
                    "type": "chatOpenAI",
                    "data": {
                        "inputs": {
                            "openAIApiKey": "demo-key-for-testing",
                            "modelName": "gpt-3.5-turbo",
                            "temperature": 0.7
                        },
                        "outputs": {}
                    },
                    "position": {"x": 100, "y": 300}
                },
                {
                    "id": "llmChain_0",
                    "type": "llmChain",
                    "data": {
                        "inputs": {},
                        "outputs": {}
                    },
                    "position": {"x": 400, "y": 200}
                }
            ],
            "edges": [
                {
                    "id": "edge_1",
                    "source": "promptTemplate_0",
                    "target": "llmChain_0",
                    "sourceHandle": "promptTemplate",
                    "targetHandle": "prompt"
                },
                {
                    "id": "edge_2",
                    "source": "chatOpenAI_0",
                    "target": "llmChain_0",
                    "sourceHandle": "chatOpenAI",
                    "targetHandle": "model"
                }
            ]
        }
        
        flow_id = flow_manager.create_flow(example_flow)
        
        return jsonify({
            "success": True,
            "data": {
                "id": flow_id,
                "message": "Example flow created successfully",
                "flowData": example_flow
            }
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

