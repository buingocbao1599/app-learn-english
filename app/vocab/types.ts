export type Word = {
  id: string;
  w: string;
  p: string;
  ipa: string;
  vi: string;
  src: "xlsx" | "pdf";
};

export type Topic = {
  slug: string;
  name: string;
  words: Word[];
};

export type TopicSummary = {
  slug: string;
  name: string;
  count: number;
  ids: string[];
};
