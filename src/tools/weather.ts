import type { LLMTool } from '../types.js';

export const weatherTool: LLMTool = {
  type: 'function',
  name: 'get_weather',
  description:
    'Get the current weather information for the provided coordinates.',
  parameters: {
    type: 'object',
    properties: {
      latitude: { type: 'number' },
      longitude: { type: 'number' },
    },
    required: ['latitude', 'longitude'],
    additionalProperties: false,
  },
  strict: true,
  handler: getWeatherInfo,
};

async function getWeatherInfo({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,temperature_2m,wind_speed_10m,precipitation,rain`,
    );
    const data = await response.json();
    return JSON.stringify(data, null, 2);
  } catch (_error) {
    return '';
  }
}
