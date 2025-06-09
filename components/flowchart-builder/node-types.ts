// Import node components (using default imports)
import GreetingNode from "@/components/nodes/greeting-node"
import QuestionNode from "@/components/nodes/question-node"
import ResponseNode from "@/components/nodes/response-node"
import CustomerResponseNode from "@/components/nodes/customer-response-node"
import EndCallNode from "@/components/nodes/end-call-node"
import TransferNode from "@/components/nodes/transfer-node"
import WebhookNode from "@/components/nodes/webhook-node"
import FacebookLeadNode from "@/components/nodes/facebook-lead-node"
import GoogleLeadNode from "@/components/nodes/google-lead-node"
import ZapierNode from "@/components/nodes/zapier-node"

// Define node types
export const nodeTypes = {
  greetingNode: GreetingNode,
  questionNode: QuestionNode,
  responseNode: ResponseNode,
  customerResponseNode: CustomerResponseNode,
  endCallNode: EndCallNode,
  transferNode: TransferNode,
  webhookNode: WebhookNode,
  facebookLeadNode: FacebookLeadNode,
  googleLeadNode: GoogleLeadNode,
  zapierNode: ZapierNode,
}
