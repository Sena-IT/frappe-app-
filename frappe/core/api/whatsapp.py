import json

import frappe
from typing import Any, Dict, Optional



@frappe.whitelist(allow_guest=True)
def send_whatsapp_message(
    to: str,
    message: str,
    content_type: str = "text",
    attachment: Optional[str] = None,
    reference_doctype: Optional[str] = None,
    reference_name: Optional[str] = None,
):
    """Public REST endpoint to send a *manual* WhatsApp message."""
    try:
        # Create the WhatsApp Message document with all required fields
        doc = frappe.get_doc({
            "doctype": "WhatsApp Message",
            "type": "Outgoing",
            "message_type": "Manual",
            "to": to,
            "message": message,
            "content_type": content_type,
            "channel": "WhatsApp",  # Set default channel
            "attach": attachment,
            "use_template": 0,  # Not using template for manual messages
            "is_reply": 0,  # Not a reply by default
            "reference_doctype": reference_doctype,
            "reference_name": reference_name,
        })
        
        # Insert the document - this will trigger before_insert hook to send message
        doc.insert(ignore_permissions=True)
        
        return {
            "status": "success", 
            "name": doc.name,
            "message_id": doc.get("message_id"),
            "doc_status": doc.get("status")
        }
        
    except Exception as exc:
        frappe.log_error(frappe.get_traceback(), "WhatsApp Message API Error")
        return {"status": "error", "error": str(exc)}