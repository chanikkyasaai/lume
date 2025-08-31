import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					secondary: 'hsl(var(--background-secondary))',
					tertiary: 'hsl(var(--background-tertiary))',
				},
				foreground: {
					DEFAULT: 'hsl(var(--foreground))',
					muted: 'hsl(var(--foreground-muted))',
					subtle: 'hsl(var(--foreground-subtle))',
				},
				glass: {
					primary: 'hsl(var(--glass-primary))',
					secondary: 'hsl(var(--glass-secondary))',
					overlay: 'hsl(var(--glass-overlay))',
				},
				glow: {
					primary: 'hsl(var(--glow-primary))',
					secondary: 'hsl(var(--glow-secondary))',
					accent: 'hsl(var(--glow-accent))',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-modern': 'var(--gradient-modern)',
				'gradient-glow': 'var(--gradient-glow)',
				'gradient-grain': 'var(--gradient-grain)',
			},
			backdropBlur: {
				'glass': '20px',
				'subtle': '8px',
			},
			boxShadow: {
				'glow': '0 0 20px hsl(var(--glow-primary) / 0.3)',
				'glow-lg': '0 0 40px hsl(var(--glow-primary) / 0.4)',
				'glow-accent': '0 0 20px hsl(var(--glow-secondary) / 0.3)',
				'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
				'glass-inset': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
				'speaking': 'speaking 0.8s ease-in-out infinite alternate',
				'waveform': 'waveform 1.5s linear infinite',
				'float': 'float 3s ease-in-out infinite',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'glow-pulse': {
					'0%': {
						boxShadow: '0 0 20px hsl(var(--glow-primary) / 0.3)'
					},
					'100%': {
						boxShadow: '0 0 40px hsl(var(--glow-primary) / 0.6), 0 0 60px hsl(var(--glow-secondary) / 0.4)'
					}
				},
				'speaking': {
					'0%': {
						transform: 'scale(1)',
						filter: 'brightness(1.2)'
					},
					'100%': {
						transform: 'scale(1.02)',
						filter: 'brightness(1.4)'
					}
				},
				'waveform': {
					'0%, 100%': {
						transform: 'scaleY(0.5)'
					},
					'50%': {
						transform: 'scaleY(1.5)'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				}
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
