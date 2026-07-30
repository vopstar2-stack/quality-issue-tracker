import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

interface EstimateContext {
  description: string | null;
  cause?: string | null;
  countermeasure?: string | null;
  photoUrls: string[];
}

function buildImageBlocks(photoUrls: string[]): Anthropic.ImageBlockParam[] {
  return photoUrls.slice(0, 5).map((url) => ({
    type: "image",
    source: { type: "url", url },
  }));
}

function extractText(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function estimateCause(input: EstimateContext): Promise<string> {
  const anthropic = getClient();
  const textParts = [
    `이슈 설명: ${input.description?.trim() || "(설명 없음)"}`,
    input.cause?.trim() ? `현재까지 파악된 발생원인 메모: ${input.cause.trim()}` : null,
    "위 정보와 첨부된 사진(있는 경우)을 참고해서 이 품질 이슈의 발생원인을 한국어로 추정해줘. 원인이 명확하지 않으면 가능성이 높은 순서대로 후보를 나열해줘. 서두 없이 본문만 간결하게 작성해줘.",
  ].filter((part): part is string => Boolean(part));

  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system:
      "당신은 의료기기 제조업체의 품질관리(QA) 전문가입니다. 품질 이슈의 발생원인을 분석하는 것이 역할입니다.",
    messages: [
      {
        role: "user",
        content: [...buildImageBlocks(input.photoUrls), { type: "text", text: textParts.join("\n\n") }],
      },
    ],
  });

  return extractText(response);
}

export async function estimateCountermeasure(input: EstimateContext): Promise<string> {
  const anthropic = getClient();
  const textParts = [
    `이슈 설명: ${input.description?.trim() || "(설명 없음)"}`,
    input.cause?.trim() ? `발생원인: ${input.cause.trim()}` : null,
    input.countermeasure?.trim()
      ? `현재까지 파악된 대책 메모: ${input.countermeasure.trim()}`
      : null,
    "위 정보와 첨부된 사진(있는 경우)을 참고해서 이 품질 이슈에 대한 대책(재발 방지 대책 포함)을 한국어로 제안해줘. 서두 없이 본문만 간결하게 작성해줘.",
  ].filter((part): part is string => Boolean(part));

  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    system:
      "당신은 의료기기 제조업체의 품질관리(QA) 전문가입니다. 품질 이슈에 대한 대책을 제안하는 것이 역할입니다.",
    messages: [
      {
        role: "user",
        content: [...buildImageBlocks(input.photoUrls), { type: "text", text: textParts.join("\n\n") }],
      },
    ],
  });

  return extractText(response);
}
