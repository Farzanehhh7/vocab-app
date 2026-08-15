/**
 * موتور رندر Template — بخش ۱۲.۳ سند معماری
 * ورودی: قالب متنی مثل "{{front}}" یا "{{meaning_fa}}<hr>{{example_en}}"
 * خروجی: HTML نهایی با مقادیر واقعی Note جایگزین‌شده
 *
 * از قصد ساده نگه داشته شده (بدون کتابخانه سنگین Handlebars)، چون فقط
 * جایگزینی متغیر ساده {{field}}، سه‌آکولاد {{{field}}} برای HTML خام
 * (فقط برای محتوای Server-Synthesized امن، نه ورودی مستقیم کاربر)،
 * و شرط ساده {{#if field}}...{{/if}} لازم است.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderCardTemplate(
  template: string,
  fieldValues: Record<string, unknown>
): string {
  let output = template;

  // پردازش شرط‌های {{#if field}}...{{/if}}
  output = output.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, key, content) => {
    return fieldValues[key] ? content : "";
  });

  // {{{field}}} — HTML خام، بدون Escape. فقط برای فیلدهایی که خودِ سرویس
  // (نه ورودی مستقیم کاربر) از قبل امن ساخته، مثل examples_html در leitner/service.ts
  output = output.replace(/\{\{\{(\w+)\}\}\}/g, (_match, key) => {
    const value = fieldValues[key];
    return value !== undefined && value !== null ? String(value) : "";
  });

  // {{field}} — مقدار کاربر Escape می‌شود، ساختار Template (مثل <hr>) دست‌نخورده می‌ماند
  output = output.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = fieldValues[key];
    if (value === undefined || value === null) return "";
    return escapeHtml(String(value));
  });

  return output;
}
