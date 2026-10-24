import type { WeatherDef } from '../../engine/world/types';

/** Weather changes every few hours per zone. It changes how often you are attacked and how battles go for everyone. */
export const WEATHER: WeatherDef[] = [
  { id: 'clear', name: 'Clear', description: 'Fine weather.', encounterMult: 1, modifiers: [] },
  { id: 'rain', name: 'Rain', description: 'Fire burns low (-15%) and lightning crackles (+10%).', encounterMult: 0.9, modifiers: [{ stat: 'fireDamage', type: 'flat', value: -15 }, { stat: 'lightningDamage', type: 'flat', value: 10 }], tint: 'rgba(60,90,140,0.18)' },
  { id: 'storm', name: 'Thunderstorm', description: 'Lightning +25%, accuracy -5. More enemies are about.', encounterMult: 1.2, modifiers: [{ stat: 'lightningDamage', type: 'flat', value: 25 }, { stat: 'accuracy', type: 'flat', value: -5 }], tint: 'rgba(40,40,90,0.3)' },
  { id: 'fog', name: 'Fog', description: 'Accuracy -10, dodge +5. Things creep up on you.', encounterMult: 1.3, modifiers: [{ stat: 'accuracy', type: 'flat', value: -10 }, { stat: 'dodge', type: 'flat', value: 5 }], tint: 'rgba(200,200,210,0.28)' },
  { id: 'snow', name: 'Snow', description: 'Ice +20%, speed -5%.', encounterMult: 0.9, modifiers: [{ stat: 'iceDamage', type: 'flat', value: 20 }, { stat: 'speed', type: 'percent', value: -5 }], tint: 'rgba(230,240,255,0.22)' },
  { id: 'heatwave', name: 'Heatwave', description: 'Fire +20%, ice -20%.', encounterMult: 0.9, modifiers: [{ stat: 'fireDamage', type: 'flat', value: 20 }, { stat: 'iceDamage', type: 'flat', value: -20 }], tint: 'rgba(255,170,60,0.15)' },
  { id: 'sandstorm', name: 'Sandstorm', description: 'Accuracy -10. The dust elementals love it.', encounterMult: 1.2, modifiers: [{ stat: 'accuracy', type: 'flat', value: -10 }], tint: 'rgba(200,160,90,0.3)' },
  { id: 'ashfall', name: 'Ashfall', description: 'Fire +15%, HP regeneration -3.', encounterMult: 1.1, modifiers: [{ stat: 'fireDamage', type: 'flat', value: 15 }, { stat: 'hpRegen', type: 'flat', value: -3 }], tint: 'rgba(80,60,60,0.3)' },
  { id: 'blood-moon', name: 'Blood Moon', description: 'Everyone deals 15% more damage. The Citadel is restless.', encounterMult: 1.3, modifiers: [{ stat: 'damageBonus', type: 'flat', value: 15 }], tint: 'rgba(140,20,30,0.25)' },
];
