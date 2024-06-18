export const VALID_RELEASE_STAGES = {
  prealpha: null,
  alpha: null,
  beta: null,
  rc: null,
  stable: null,
} as const;

export const VALID_RELEASE_STAGE_ARRAY: (keyof typeof VALID_RELEASE_STAGES)[] = [
  "prealpha",
  "alpha",
  "beta",
  "rc",
  "stable",
];

export type ReleaseStage = keyof typeof VALID_RELEASE_STAGES;

export class ReleaseVersion {
  constructor(
    public readonly version: number[],
    public readonly stage: ReleaseStage,
    public readonly iteration: number,
  ) {}

  toString(): string {
    let ver = `${this.version[0]}.${this.version[1]}.${this.version[2]}`;

    if (this.stage !== "stable") {
      ver += `-${this.stage}`;

      if (this.iteration > 1) {
        ver += `${this.iteration}`;
      }
    }

    return ver;
  }

  toArray(): number[] {
    return [this.version[0]!, this.version[1]!, this.version[2]!];
  }
}

export function isStringValidReleaseStage(value: string): boolean {
  return value in VALID_RELEASE_STAGES;
}
