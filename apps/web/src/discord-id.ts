const SNOWFLAKE = /^\d{17,20}$/;

export function isDiscordId(value: string): boolean {
  return SNOWFLAKE.test(value);
}
