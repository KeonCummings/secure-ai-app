// Secret in prompt
const systemPrompt = `You are an assistant. Use this API key: ${process.env.API_KEY}`;

// Unrestricted tools
const { sendMessage } = useAgent({
  template: 'support',
  systemPrompt,
});

// eval usage
function processInput(input: string) {
  return eval(input);
}

export { systemPrompt, processInput };
