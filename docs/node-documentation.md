# Blink.AI Flowchart Builder - Node Documentation

## Overview

The Blink.AI Flowchart Builder provides a comprehensive set of nodes for creating sophisticated AI-powered call flows. This documentation covers all available node types, their functionality, configuration options, and best practices.

## Node Categories

### 🗣️ Core Communication Nodes

#### 1. Greeting Node
**Purpose**: Starting point for conversations with welcome messages and initial prompts.

**Configuration Options**:
- `text`: The greeting message (e.g., "Hello! This is an AI assistant calling...")
- `extractVars`: Variables to extract from the conversation
- `modelOptions`: AI model settings (temperature, type)

**Use Cases**:
- Welcome callers to your service
- Introduce the AI assistant
- Set the tone for the conversation
- Begin data collection

**Best Practices**:
- Keep greetings friendly and professional
- Clearly identify the AI assistant
- Set expectations for the call
- Include your company/service name

---

#### 2. Question Node
**Purpose**: Ask specific questions to gather information from callers.

**Configuration Options**:
- `text`: The question to ask
- `extractVars`: Variables to extract from responses
- `followUpPrompts`: Additional prompts based on responses

**Use Cases**:
- Gather customer information
- Qualify leads
- Conduct surveys
- Collect feedback

**Best Practices**:
- Ask one question at a time
- Use clear, simple language
- Provide context when needed
- Allow for natural responses

---

#### 3. Response Node
**Purpose**: Provide AI-generated responses based on conversation context.

**Configuration Options**:
- `text`: Base response text
- `dynamicContent`: Context-aware response generation
- `personalizations`: Customer-specific customizations

**Use Cases**:
- Answer customer questions
- Provide information
- Acknowledge customer input
- Transition between topics

**Best Practices**:
- Keep responses concise
- Use natural language
- Personalize when possible
- Maintain conversation flow

---

#### 4. Customer Response Node
**Purpose**: Handle multiple choice responses and open-ended input from customers.

**Configuration Options**:
- `responses`: Array of expected response options
- `options`: Multiple choice options to present
- `isOpenEnded`: Allow free-form responses
- `intentDescription`: Description of what to capture
- `extractVars`: Variables to extract from responses

**Use Cases**:
- Multiple choice questions
- Yes/No confirmations
- Open-ended feedback
- Data collection forms

**Best Practices**:
- Provide clear options
- Handle unexpected responses
- Use intent recognition
- Validate important data

---

### 🧠 Logic & Control Nodes

#### 5. Conditional Node
**Purpose**: Create branching logic based on variables, responses, or conditions.

**Configuration Options**:
- `condition`: The condition to evaluate
- `trueLabel`: Label for the "true" path
- `falseLabel`: Label for the "false" path
- `variables`: Variables to check in conditions

**Use Cases**:
- Route calls based on customer type
- Check qualification criteria
- Personalize conversation paths
- Handle different scenarios

**Best Practices**:
- Use clear condition logic
- Test all possible paths
- Provide fallback options
- Document complex conditions

---

### 🔗 Integration Nodes

#### 6. Webhook Node
**Purpose**: Connect to external APIs and integrate with third-party services.

**Configuration Options**:
- `url`: API endpoint URL
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `headers`: Request headers
- `body`: Request body (for POST/PUT)
- `extractVars`: Variables to extract from API response

**Use Cases**:
- CRM integration
- Database lookups
- External validations
- Real-time data retrieval

**Best Practices**:
- Handle API failures gracefully
- Set appropriate timeouts
- Validate API responses
- Secure sensitive data

---

#### 7. Facebook Lead Node
**Purpose**: Track and manage leads from Facebook advertising campaigns.

**Configuration Options**:
- `campaignId`: Facebook campaign identifier
- `adSetId`: Ad set identifier
- `leadData`: Lead information to track
- `conversionEvents`: Events to track

**Use Cases**:
- Track Facebook ad conversions
- Qualify Facebook leads
- Integrate with Facebook Lead Ads
- Measure campaign effectiveness

**Best Practices**:
- Set up proper tracking
- Comply with Facebook policies
- Validate lead quality
- Follow up promptly

---

#### 8. Google Lead Node
**Purpose**: Track and manage leads from Google advertising campaigns.

**Configuration Options**:
- `campaignId`: Google Ads campaign identifier
- `adGroupId`: Ad group identifier
- `keywords`: Associated keywords
- `conversionActions`: Conversion actions to track

**Use Cases**:
- Track Google Ads conversions
- Qualify Google leads
- Measure keyword performance
- Optimize ad campaigns

**Best Practices**:
- Set up conversion tracking
- Use relevant keywords
- Monitor lead quality
- Optimize for ROI

---

#### 9. Zapier Node
**Purpose**: Connect to 5000+ apps and services through Zapier automation.

**Configuration Options**:
- `zapierWebhookUrl`: Zapier webhook URL
- `triggerData`: Data to send to Zapier
- `actionType`: Type of Zapier action
- `appConnections`: Connected app configurations

**Use Cases**:
- CRM updates
- Email marketing automation
- Spreadsheet updates
- Multi-app workflows

**Best Practices**:
- Test Zapier connections
- Handle webhook failures
- Monitor automation limits
- Keep data synchronized

---

### 📞 Call Management Nodes

#### 10. Transfer Node
**Purpose**: Transfer calls to human agents or other phone numbers.

**Configuration Options**:
- `transferNumber`: Phone number to transfer to
- `transferType`: Type of transfer (agent, department, external)
- `transferMessage`: Message before transfer
- `fallbackAction`: Action if transfer fails

**Use Cases**:
- Escalate to human agents
- Route to specialists
- Transfer to departments
- Handle complex issues

**Best Practices**:
- Inform customers about transfers
- Provide context to agents
- Have fallback options
- Monitor transfer success rates

---

#### 11. End Call Node
**Purpose**: Gracefully end conversations with appropriate closing messages.

**Configuration Options**:
- `text`: Closing message
- `followUpActions`: Post-call actions
- `surveyPrompt`: Optional satisfaction survey
- `callSummary`: Summary of call outcomes

**Use Cases**:
- Professional call endings
- Thank customers
- Provide next steps
- Collect feedback

**Best Practices**:
- Always thank the customer
- Summarize key points
- Provide contact information
- End on a positive note

---

## Variable Management

### Extracting Variables
All nodes support variable extraction through the `extractVars` configuration:

\`\`\`javascript
extractVars: [
  ["customer_name", "string", "Extract the customer's name", true],
  ["phone_number", "string", "Extract phone number", true],
  ["age", "integer", "Extract customer age", false],
  ["email", "string", "Extract email address", false]
]
\`\`\`

### Variable Format
- **Name**: Variable identifier
- **Type**: Data type (string, integer, boolean, array)
- **Description**: What the variable represents
- **Required**: Whether the variable is mandatory

### Using Variables
Variables can be referenced in subsequent nodes:
- `{customer_name}` - Insert customer name
- `{phone_number}` - Insert phone number
- `{age}` - Insert age value

---

## Flow Patterns

### Linear Flow
Simple sequential conversation:
\`\`\`
Greeting → Question → Response → End Call
\`\`\`

### Branching Flow
Conditional paths based on responses:
\`\`\`
Greeting → Question → Conditional → [Path A / Path B] → End Call
\`\`\`

### Integration Flow
External data integration:
\`\`\`
Greeting → Webhook → Response → Transfer → End Call
\`\`\`

### Lead Qualification Flow
Comprehensive lead processing:
\`\`\`
Greeting → Questions → Conditional → [Qualified/Unqualified] → [Transfer/End]
\`\`\`

---

## Best Practices

### General Guidelines
1. **Keep conversations natural** - Use conversational language
2. **Handle errors gracefully** - Always have fallback options
3. **Test thoroughly** - Test all conversation paths
4. **Monitor performance** - Track success rates and user satisfaction
5. **Iterate and improve** - Continuously optimize based on data

### Node-Specific Tips
- **Greeting Nodes**: Set clear expectations
- **Question Nodes**: Ask one thing at a time
- **Response Nodes**: Keep answers concise
- **Conditional Nodes**: Test all branches
- **Integration Nodes**: Handle API failures
- **Transfer Nodes**: Provide context to agents
- **End Nodes**: Always thank the customer

### Performance Optimization
- Minimize API calls in critical paths
- Use caching for frequently accessed data
- Optimize conversation length
- Monitor response times
- Handle timeouts appropriately

---

## Troubleshooting

### Common Issues
1. **Variables not extracting** - Check variable names and types
2. **API calls failing** - Verify endpoints and authentication
3. **Transfers not working** - Check phone number formats
4. **Conditions not evaluating** - Verify condition syntax
5. **Responses too long** - Keep messages concise

### Debugging Tips
- Use the test pathway feature
- Check console logs for errors
- Verify API responses
- Test with different inputs
- Monitor call analytics

---

## Advanced Features

### Dynamic Content
Use variables and conditions to create dynamic responses:
\`\`\`javascript
text: "Hello {customer_name}, I see you're interested in {product_type}."
\`\`\`

### Multi-language Support
Configure nodes for different languages:
\`\`\`javascript
text: {
  en: "Hello, how can I help you?",
  es: "Hola, ¿cómo puedo ayudarte?",
  fr: "Bonjour, comment puis-je vous aider?"
}
\`\`\`

### A/B Testing
Test different conversation flows:
- Create multiple versions of nodes
- Route traffic between versions
- Measure performance differences
- Optimize based on results

---

This documentation provides a comprehensive guide to all available nodes in the Blink.AI Flowchart Builder. For additional support or advanced use cases, please refer to the platform documentation or contact support.
