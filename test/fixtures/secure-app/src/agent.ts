// No secrets in prompt
const systemPrompt = `You are a helpful assistant.`;

// Tools restricted
const { sendMessage } = useAgent({
  template: 'support',
  systemPrompt,
  allowedTools: ['search', 'calculate'],
});

export { systemPrompt };
