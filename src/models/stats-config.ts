interface StatisticRenderer<T> {
  (value: T[keyof T]): string;
}

export interface StatisticConfig<T> {
  enabled: boolean;
  renderer: StatisticRenderer<T>;
}

export type StatsConfig<T, V> = {
  [K in keyof T]?: V;
};
