import { LAUNCH_MODE } from '@/enums/tokens'

export type LaunchMode = (typeof LAUNCH_MODE)[keyof typeof LAUNCH_MODE]
