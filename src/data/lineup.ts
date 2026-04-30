import type { Artist, DayId, FestivalDay, FestivalStage, StageId } from "../types";

export const festival = {
  name: "Download Festival",
  year: 2026,
  location: "Donington Park",
  sourceUrl: "https://downloadfestival.co.uk/lineup/",
};

export const mainFestivalDays: FestivalDay[] = [
  { id: "friday", label: "Friday 12 June", shortLabel: "Fri", date: "2026-06-12" },
  { id: "saturday", label: "Saturday 13 June", shortLabel: "Sat", date: "2026-06-13" },
  { id: "sunday", label: "Sunday 14 June", shortLabel: "Sun", date: "2026-06-14" },
];

export const districtXDays: FestivalDay[] = [
  { id: "wednesday", label: "Wednesday 10 June", shortLabel: "Wed", date: "2026-06-10" },
  { id: "thursday", label: "Thursday 11 June", shortLabel: "Thu", date: "2026-06-11" },
];

export const festivalDays: FestivalDay[] = [...mainFestivalDays];

export const allFestivalDays: FestivalDay[] = [...districtXDays, ...mainFestivalDays];

export const mainFestivalStages: FestivalStage[] = [
  { id: "apex", name: "Apex Stage", shortName: "Apex" },
  { id: "opus", name: "Opus Stage", shortName: "Opus" },
  { id: "avalanche", name: "The Avalanche Stage", shortName: "Avalanche" },
  { id: "dogtooth", name: "The Dogtooth Stage", shortName: "Dogtooth" },
];

export const districtXStages: FestivalStage[] = [
  { id: "district-den", name: "The Den (District X)", shortName: "The Den" },
  { id: "district-doghouse", name: "The Doghouse (District X)", shortName: "Doghouse" },
  { id: "district-ace-spades", name: "Ace of Spades (District X)", shortName: "Ace of Spades" },
  { id: "district-outpost", name: "The Outpost (District X)", shortName: "Outpost" },
  { id: "rip-courtyard", name: "RIP Courtyard", shortName: "RIP Courtyard" },
];

export const festivalStages: FestivalStage[] = [...mainFestivalStages];

export const allFestivalStages: FestivalStage[] = [...mainFestivalStages, ...districtXStages];

export const getFestivalDays = (includeDistrictX = false) =>
  includeDistrictX ? allFestivalDays : festivalDays;

export const getFestivalStages = (includeDistrictX = false) =>
  includeDistrictX ? allFestivalStages : festivalStages;

export const daySortIndex = new Map(allFestivalDays.map((day, index) => [day.id, index]));

export const getDaySortIndex = (id: DayId) => daySortIndex.get(id) ?? 999;

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[øØ]/g, "o")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

type LineupArtistInput =
  | string
  | {
      name: string;
      start?: string;
      end?: string;
      spotifyArtistId?: string;
      spotifyTrackIds?: string[];
    };

// Edit set times here. Example:
// "Limp Bizkit",
// becomes:
// { name: "Limp Bizkit", start: "20:50", end: "22:20" },
const addArtists = (
  day: DayId,
  stage: StageId,
  entries: LineupArtistInput[],
  startOrder: number,
): Artist[] => {
  const normalizedEntries = entries.map((entry) => (typeof entry === "string" ? { name: entry } : entry));
  const slugCounts = new Map<string, number>();

  normalizedEntries.forEach((entry) => {
    const slug = slugify(entry.name);
    slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  });

  const seenSlugs = new Map<string, number>();

  return normalizedEntries.map((details, index) => {
    const baseSlug = slugify(details.name);
    const seenCount = seenSlugs.get(baseSlug) ?? 0;
    seenSlugs.set(baseSlug, seenCount + 1);
    const needsSuffix = (slugCounts.get(baseSlug) ?? 0) > 1;
    const suffix = needsSuffix ? `-${slugify(`${details.start ?? seenCount + 1}-${details.end ?? ""}`)}` : "";

    return {
      id: `${day}-${stage}-${baseSlug}${suffix}`,
      name: details.name,
      day,
      stage,
      order: startOrder + index,
      defaultStart: details.start ?? "",
      defaultEnd: details.end ?? "",
      spotifyArtistId: details.spotifyArtistId,
      spotifyTrackIds: details.spotifyTrackIds,
    };
  });
};

export const lineup: Artist[] = [
  ...addArtists("friday", "apex", [
    { name: "Limp Bizkit", start: "20:50", end: "22:30", spotifyTrackIds: ["5cZqsjVs6MevCnAkasbEOX", "3IV4swNduIRunHREK80owz", "1MTQHCpraD4S8g5PAFKzoj", "2avKuMN2QXkaG9vvHa2JLt", "2gABnPYOMsyxThmsOQ4uWK"] },
    { name: "Cypress Hill", start: "19:00", end: "20:10", spotifyTrackIds: ["1oTHteQbmJw15rPxPVXUTv", "0cfqYhY6B8PbGF9vaVNUeG", "2gABnPYOMsyxThmsOQ4uWK", "5hYr8yRbQLFE20oS7Mi3T2", "3kesvMTfd0kFtkcYk47k4a"] },
    { name: "Electric Callboy", start: "17:30", end: "18:30", spotifyTrackIds: ["0W4N0KzHKWQp2Wn1Mf6uMa", "2S3u18aJF8eExll5dYwSJb", "2qOmcSjOQEDIJKosonn75a", "6emZMVNvIxW57fhxPlyxLp", "2zNZ81rcbDUvOmKo0borJr"] },
    { name: "Pendulum", start: "16:10", end: "17:00", spotifyTrackIds: ["4Y2glvLjQGOb4dXnwm1hQf", "5wqlRFdpJ1a4kMIBSWeCnN", "5ami95W9OOWQPwrBb5tud5", "6tC2iHfUlzB2W4ntXXL2BH", "0G7qyvqwjfMdHZn4RwiAdf"] },
    { name: "Hollywood Undead", start: "15:00", end: "15:40", spotifyTrackIds: ["5wBLDkxVvclanSitx5jq8e", "1czaCgWLWgqp0eRIZ0BcXh", "7vWaeCBcobKgzJgbOl23KU", "07BuyVse8pYAWd9DXD7B2D", "5toE2GI4iMIpelQtzKNT9Q"] },
    { name: "P.O.D.", start: "14:00", end: "14:30", spotifyTrackIds: ["0UrWr7Jnu1heq1o99ZwUd0", "5DooySfCD1xCJ49gQm9rx7", "1X4Ntw6Lbaa1ACgilCqMpr", "1Xf9XhxiCHnru2jEwGgD4D", "3zAIrDlrGJ5cwBHMR1YaLl"] },
    { name: "Scene Queen", start: "13:00", end: "13:30", spotifyTrackIds: ["7aVUykGDZCRyLRKCQrtrbx", "6xeMsEEUC7lhZc9xLty606", "32ljWqOxw3ckyuaUc882F6", "2jRciInArYaE7ON8RkUD8Q", "3DL4hiSqYyKVh12ltLVHHe"] },
  ], 100),
  ...addArtists("saturday", "apex", [
    { name: "Guns N' Roses", start: "19:35", end: "22:55", spotifyTrackIds: ["7snQQk1zcKl8gZ92AnueZW", "0G21yYKMZoHa30cYVi1iA8", "6eN1f9KNmiWEhpE2RhQqB5", "3YRCqOhFifThpSRFJ1VWFM", "4JiEyzf0Md7KEFFGWDDdCr"] },
    { name: "Trivium", start: "17:20", end: "18:30", spotifyTrackIds: ["5yDJpu0xh0d1w13gXaE3lS", "0HRrX9EWtLIy6UC2nS7p85", "1hPKSQuvfLlPeIu8xhRyTf", "28W3x7B8Ykiv97Cr7LA3hP", "6156ZPGcezId0Bmw7x7c7K"] },
    { name: "BABYMETAL", start: "15:50", end: "16:45", spotifyTrackIds: ["7CAbF0By0Fpnbiu6Xn5ZF7", "720fHdd3JpPoRRR3o0kOrc", "5pjnTPgrmUjviS0COHjbgy", "6sTa66IYzTcTIWlvXKfqqn", "0S6wuDXHdmsKetgEXEMgUh"] },
    { name: "Black Veil Brides", start: "14:30", end: "15:20", spotifyTrackIds: ["1RTYixE1DD3g3upEpmCJpa", "2ZhswJTKMkNNTAjrTmPhOJ", "3WnrxWNTHDGyCVCwfMJPtR", "2ga6snMTvF6JRNWVoLBMZc", "098MjOfQMOjxqKkoewErxV"] },
    { name: "LANDMVRKS", start: "13:15", end: "14:00", spotifyTrackIds: ["4htktiAhxjhd4oyv4w7aF0", "3BzrV9GCvaCr4m7N2FvNvK", "0eLcZsqcdFoosQC3DV3d4L", "2e9HC16cEYxDnj4QAmsYi4", "1TrwZRry2cqVRZPPvwxJbw"] },
    { name: "South Arcade", start: "12:05", end: "12:45", spotifyTrackIds: ["1JMKlrFJ28qptDhPhk2h3o", "33cMHo00Ny7Hflb1TkzOgF", "6C3FclWeh96qB5zVwhvZfE", "3sJqwv03E6HDTLqaFqlE6I", "5dfEfhkBbG5pidgq0feEHu"] },
    { name: "Thornhill", start: "11:00", end: "11:35", spotifyTrackIds: ["1mK4v6sSCbKR2mMAWG2zMy", "6nL8EQd87CJn79VWPbDZ2O", "7KvdIbkqnpUikG7K0jS7Za", "2BB7farF3gHkxzw3NECCeV", "68Y84dhYPIE0kHs13otJjy"] },
  ], 200),
  ...addArtists("sunday", "apex", [
    { name: "Linkin Park", start: "21:25", end: "22:55", spotifyTrackIds: ["60a0Rd6pjrkxjPbaKzXjfq", "1y1sChqjzdNWzwdHQADMrR", "18lR4BzEs7e3qzc0KVkTpU", "7AB0cUXnzuSlAnyHOqmrZr", "1h94Gt9wygZ7vPFR07fYPG"] },
    { name: "Bad Omens", start: "19:00", end: "20:10", spotifyTrackIds: ["1H4Y9uW4N0LsxJUz0VnaPJ", "6tRneEcItwpSxBtqgem5Dr", "0xoyUiHhxVH4gwb0CRgNmg", "1u3OxJiXoYFdA0Fmd9yURC", "4TzGD5Pryq8DTjv5QRuJaW"] },
    { name: "Ice Nine Kills", start: "17:05", end: "18:05", spotifyTrackIds: ["2mMNBgFRyEiRoGvrdoONeq", "04K2bMi2vyOBwxr5EjDq5O", "1tBghD5Z8rBeN7eHDXLamy", "7H5q9RsWBDRrKq2qCdv2HG", "3AkCkuC8LuRFEnvyKBQUOg"] },
    { name: "The Pretty Reckless", start: "15:40", end: "16:30", spotifyTrackIds: ["2opyAm6zOyjR0An5LkblfN", "04w73SmPfQkkmEpKbcrHOL", "0JaCpPppNvZnSFtA2V5uFy", "6ISZ6sKcNBdYJS7XYHm5cV", "4U0nhramvy2HXuNcsug8Dk"] },
    { name: "Bloodywood", start: "14:25", end: "15:10", spotifyTrackIds: ["7qzEk069ZJct9qjiWGTGbD", "5j0WY6cTRud78QFLdfaS2N", "3Kj2M9gRU1Lwf5eiNjBtBp", "1w2yLabkggvY64JilKWL73", "0L9BvHNTJF9yaN77P3z1PC"] },
    { name: "RØRY", start: "13:10", end: "13:55", spotifyTrackIds: ["6kcAPH3vOqllB0GMVUVjEo", "3lhPh8BDUwgyM4pvF4Xtyr", "094JJ0U1YbXvof6wM0oYyU", "2zjBoQPdXMjgnVfnS8V9zx", "7MzYunk9yPyDsJjSPTppuH"] },
    { name: "Kublai Khan TX", start: "12:00", end: "12:40", spotifyTrackIds: ["4Xg8YbCGzuLPOdZ2ILVLmU", "2eqjpko1AQuTdxkBFhAcRG", "3xqphesjm6paYsZjBqYSaA", "0XMS3gFsLsCRnTxsHX9Bv3", "0Tv7bJqFc8YOS5It6Ap4Ug"] },
    { name: "unpeople", start: "11:00", end: "11:30", spotifyTrackIds: ["70yMk0UK1BTtPvhqcSXvnF", "0Rs9oXTRtpOJZMe7guExYP", "40jPLM3P6oVJjmB9xMCdIg", "48kmtqMpOzzykg1vV9fvKy", "4C5PFMmtVD179UsJ2U5jBH"] },
  ], 300),
  ...addArtists("friday", "opus", [
    { name: "Halestorm", start: "19:35", end: "20:50", spotifyTrackIds: ["3gmEzilP9BzF45wIMvA16l", "0n3sHHfdOq6Awix3JPe3xl", "5l3gAGbkXFfPWxh4a3J8mp", "0JKY13K1Io2aqXJb96UyzX", "78mjaBatbfvwx5KJwI036H"] },
    { name: "Daughtry", start: "18:15", end: "19:05", spotifyTrackIds: ["7mXmxXLAnsvXKt4Q37KoMI", "0wIhWLNLIOmzQ89B3rtTd3", "2nXWKf0GXbFby4posGqEht", "43Jj5ZGeOnhKGs2Hxsz6BG", "6hpdU3OhCetJFA8a42nkpj"] },
    { name: "Periphery", start: "17:00", end: "17:45", spotifyTrackIds: ["2YZZ8qsDdvC008LgtpMoI6", "3oKd79SzqVkiel75QUZxAy", "2fYC3xAyQgnpJCCYl1TH7y", "3YNLEKZRHVLc5RBAAedFvW", "5lF73HA0eQYUBg8DyPESXJ"] },
    { name: "Creeper", start: "15:50", end: "16:30", spotifyTrackIds: ["7l2Vx0Jg88oi16ja4Huc9H", "1iNKQ8LIG4OVFK3o9vmmUY", "7wtp2m3k1tc6Phm2EsGbDf", "1mfp3yBSTJOfyQM32aOxFP", "4V9tHNaQgMM68iCblniJ59"] },
    { name: "Paleface Swiss", start: "14:55", end: "15:25", spotifyTrackIds: ["0Wg3AgtSF4RhWCcFqfTy0H", "6oAsEkDRFsQt0HxDuc26g2", "4b03h3kkRIhZQSS23xr1Om", "1maGwMYv6cakqEGHbDd17h", "0PypDyALeRkiAAonaA5BZ9"] },
    { name: "Silent Planet", start: "13:50", end: "14:30", spotifyTrackIds: ["1Chjeu7itQhIgeL1HpVDuN", "1W1iKqn0oPrnAGyKUmdFNy", "4Ch4KTUJLaYT4ipw7LNjln", "4nVH6g0FRJVGElBfydfjEa", "4sYw5PR6QdLaZ5xOYjwYG9"] },
    { name: "Caskets", start: "13:00", end: "13:25", spotifyTrackIds: ["1nxbn0COjeyH7MQZ27T3CR", "13YWByXibBltt3T5u3IcT7", "5nxcR7W60CU3cvmGX1jBzQ", "0JWpbl3Ppr71ONy6VDP5vu", "0xjK3dF93FVr2HC0BU29aj"] },
  ], 400),
  ...addArtists("saturday", "opus", [
    { name: "Architects", start: "19:35", end: "20:50", spotifyTrackIds: ["5ofoB8PFmocBXFBEWVb6Vz", "75R95k0ICuZBFVEjBauOtt", "65qBr6ToDUjTD1RiE1H4Gl", "3VGheGbJrEnGvwteXNBDNt", "7DkN4oeXv2mqyPy0sJNrus"] },
    { name: "Behemoth", start: "18:10", end: "19:00", spotifyTrackIds: ["4JynkH6Oa9cJ0zUTzYA2UP", "5KzMpwYY3TPyZKQk9pgJ1k", "2Q73wKbwLLcGS404gkTfjH", "38whEjxU2YhboIosRm0Aty", "0xwfDhU1YaXmNFnwhToFrT"] },
    { name: "Bush", start: "17:00", end: "17:40", spotifyTrackIds: ["5buITai6eMzU8rJonMEI6e", "1wrhhPzd2ncJPNgUcGgBGg", "7KgVUnGCMEXBwY2EeqGlaI", "2EYnvZoSEkwiC8ynBcjLyi", "5l2DXYLyBVZWhdpgqa3a9k"] },
    { name: "Set It Off", start: "15:50", end: "16:30", spotifyTrackIds: ["4WXFDVe299Po8ih6Np54n2", "4oaU0fMSg3n9kqOwmLPVhH", "39ShyO1yBCiEoEXHX9ie0F", "72vsd9IEBIonmvIY7TEjXK", "4JxkeslKwbebhWIt1R50od"] },
    { name: "Those Damn Crows", start: "14:45", end: "15:25", spotifyTrackIds: ["7aRs8vnr1XXWyjeYnFhvaO", "1FlonjEZc6dTskLE25gIMH", "4qp32ei8o3EnDbXlYMuIB6", "6ihh48ZhT3PedSDhRbZb4B", "3C89UKuCbUxseLc3zhHVYZ"] },
    { name: "We Came As Romans", start: "13:40", end: "14:15", spotifyTrackIds: ["1g5Jqwo02PuitYfv19B6Jn", "0fr7Nl49mFbf6nXXca6YwO", "4rIoGk5qkn0yRDshvHVyjb", "2Owosq1UmHdHrL6h428lAn", "4iLRsbijzBUP9AkQVlEn6z"] },
    { name: "Drowning Pool", start: "12:45", end: "13:15", spotifyTrackIds: ["7CpbhqKUedOIrcvc94p60Y", "3ENHpbTuY72FukZbwGP6bc", "4AaZtoVREGSOTMzdzLoCGK", "5sSrK9FXfWbL5qwbMASHeb", "4Q1w4Ryyi8KNxxaFlOQClK"] },
    { name: "Snot", start: "11:55", end: "12:20", spotifyTrackIds: ["3qCQNtggJw1gxoptMgDhyR", "2JwXaSydgAdddfByYzf74H", "055gmThNOKdWMlfSiF5QPB", "7au6rc1TndcVsdJN75rTiO", "0uSbuo5FFbXmiJPiGfRc0N"] },
    { name: "The Wildhearts", start: "11:00", end: "11:30", spotifyTrackIds: ["6tzD57TajLivAETdoRa2B5", "4YfyTdpbuMDFgPG6s3JXAJ", "1mV71j3oM1qYFzTVgkmAYU", "0TxahxdXi6rSpJRTb2h5OJ", "0YPq5rFE7pWoVUGC3jxYAs"] },
  ], 500),
  ...addArtists("sunday", "opus", [
    { name: "A Day To Remember", start: "20:10", end: "21:20", spotifyTrackIds: ["3rEwGRmPVVudVjqdgv0tRR", "1KHKeIouP04dDtl0EetgED", "4JsDHMv5PVO8N07DbDq33r", "0T8P86fvSK8kCUJFYPZbIH", "2dwhns14pjuxxcM5a0eOow"] },
    { name: "Mastodon", start: "18:45", end: "19:30", spotifyTrackIds: ["3jagGO7eHHuaD53ibehkux", "6EF0xhfKtQNqUPz2mnE5BD", "4Ynr1SPCeUI0W0YPeSFSIK", "1dfHpGeaXunLRNvzSZOZtc", "4Ut80ggQbyiJN2pGCs7VfB"] },
    { name: "Tom Morello", start: "17:35", end: "18:15", spotifyTrackIds: ["44Xyja7xYPlVC6v2CeweSi", "2K7g8dvwkIGgPEYKivmatN", "0lEHnMNNYusZtbon9XyA2W", "2ONPuwAuOVO6RbzKaiowxD", "3PNuq4zUgDMTqdBuGeg50m"] },
    { name: "Social Distortion", start: "16:25", end: "17:05", spotifyTrackIds: ["4Q4w8aRdfhIIEhBututktL", "1IXre3fKPrv3NigaOdMoWU", "4CsTkNvkwQLel6sxQqrXSj", "3hKScGxI28Zor6zJ7JL7aS", "7tZ1sF5HLhqtRO0bITs4lV"] },
    { name: "The Plot In You", start: "15:30", end: "16:00", spotifyTrackIds: ["4xDwCYhobDehSBGUmd5H6Y", "06j7eVHrgRSt9eQSWhH3zK", "0ZZCltcOacjI1kY4BnVDjt", "2ciYYljvXw3vJdWi6hkEfS", "13TI2bhTRld8pgk9xM8wm9"] },
    { name: "thrown", start: "14:35", end: "15:05", spotifyTrackIds: ["1EZ35gYHH03sSYn9f1zpLc", "1S0z4FLaviCksg3qusRhuz", "5Sl5nxwOOREn5pBoZyPomu", "4zkKwwSVUA6pDWL9F8Apky", "7CmuIJZ7tKAw0ZqWpLAVi1"] },
    { name: "Dogstar", start: "13:40", end: "14:10", spotifyTrackIds: ["1PauS2gkdRNIXvuPuANHcf", "1bqiqgU4ELQpw8iU3I8LNH", "7t6a7n23SZQ5A5OuXYu3uO", "4QGGLjKe2TgPdBKVH6FKfR", "1obLPKC4pXRJCEDEizYl6l"] },
    { name: "Mammoth", start: "12:40", end: "13:15", spotifyTrackIds: ["7g8Xffd97LHH8ZeByxDiRB", "37EMTlg8KIQRED2lsxuNhj", "1oxh5M17Q5rCGnMvIgxfCa", "6O07S5jyxG1e2hri4pcIjY", "1SH9wSHJfwgYNcR6r2OZ8G"] },
    { name: "Catch Your Breath", start: "11:50", end: "12:15", spotifyTrackIds: ["0ZL5gQSDKEC7TjeoXA0HuR", "4HcEbEktrop4XPX02iULMM", "7qqVbi9pbCJBTxYKYwKBxY", "7mebPdG8uH4mZQnpn8i4yG", "0Api4AdCfRrGYhj8AeSjNp"] },
    { name: "Ego Kill Talent", start: "11:00", end: "11:25", spotifyTrackIds: ["2eM5J3hD2JNm5EecjiAo8l", "1tpszqsySRcFYxecUQDWLs", "67teO9LNwzE5YCvGymAYJN", "72UdiRQz5eGM1hVIA3t26E", "5aX1uAVmcZKp7Q2hfilmW4"] },
  ], 600),
  ...addArtists("friday", "avalanche", [
    { name: "Feeder", start: "19:55", end: "20:55", spotifyTrackIds: ["40UrzlNBWzJn1Qxxs9HInZ", "2L0ojdSEhQiQKID1nVMirr", "26FPGV8xgRwsQUHefWKNg6", "08DO757dzPTgeHSwOQvnIS", "0iVGyBfOsHR6WhVQd7xdkO"] },
    { name: "Story Of The Year", start: "18:55", end: "19:25", spotifyTrackIds: ["0DKNNR9iDjwfCEpMiFXMJq", "4sPJgy0CksvmXp9jC0W4gv", "1ED1SD4TRK5NprtJ837Eaa", "3WsgkhWH001sMkbZVcjreS", "7yGhfjsppOXSLcoSwcJ1yT"] },
    { name: "Sleep Theory", start: "18:00", end: "18:30", spotifyTrackIds: ["5APO7v8EPx1Tr1zAwkauja", "6L3AIgI8WTdLX8BEtrj1ut", "35N9LmzkCjMd2ZmAATzG6U", "3M3oltaiY0Hfl7F7IRhPSA", "3tlw6dqv2qejTGLnVaEsgb"] },
    { name: "Rain City Drive", start: "17:10", end: "17:35", spotifyTrackIds: ["6nqCVzh5uUc85E0Kctky9r", "2sfH7KtjAnWv1algu94TR5", "6vgeVoI1aqygSvlhqqs2Tn", "6Ps8twA0kAJ1jSZzhvdBQI", "5G7GEa11aklV6PKYmSp3LP"] },
    { name: "DRAIN", start: "16:20", end: "16:45", spotifyTrackIds: ["58z4qdwM0zpWJEGfjSptR7", "5UTCChsNnTNbhBABFTffGT", "2XzvMw2Qb8UYvKvLiNI135", "5cHRN4RhMWIjuuBLKjtYOl", "4nsG0iWO2WH4EMdc9KcGZ3"] },
    { name: "Lakeview", start: "15:30", end: "15:55", spotifyTrackIds: ["1KPpDapDvA1MpFZpGac3fD", "47nCfmlud9neettwjUorHJ", "3DXv5BpVaYHDmWGgmaHFRO", "5hggNU5pVbB5bLUdg3kCeH", "2ujeTM4ltwdzO4KvzBBxUJ"] },
    { name: "Holywatr", start: "14:40", end: "15:05", spotifyTrackIds: ["6mECy2sJqhwUR3ZHGLT4pZ", "1AzagSC4r5XHDMOlYOaWND", "6b30Si6X4QkRsjwCUDsCTs", "06p1T2lJqbBebzmm9IgLbf", "1gnHakvw1RbwFiCoZ1qgC1"] },
    { name: "Silly Goose", start: "13:50", end: "14:15", spotifyTrackIds: ["0yaRBGoeOXAwCt6dnpUPnr", "7wdIea7SkyLruOWRPeFJkL", "6VAC7OEF4LNTfCynohX4Wp", "3gpWJdEl2siwZTran2nhRH", "5mp0CFvNgluk4cB5Tx0UbT"] },
    { name: "Native James", start: "13:00", end: "13:25", spotifyTrackIds: ["4iULeNz9LxtfOrggM6rwSc", "0A0O1QCrZ6wYjoRtp3EePs", "7CveLkoaEo4iCwYT0NdZlC", "7CtpvWmTKId7nL7kgDV1Uv", "6GW3d5WzJZ6bQICl6zoQZj"] },
  ], 700),
  ...addArtists("saturday", "avalanche", [
    { name: "The All-American Rejects", start: "19:40", end: "20:40", spotifyTrackIds: ["5gb9UJkh8TfrNMRYOJNbew", "5lDriBxJd22IhOH9zTcFrV", "2l57cfmCnOkwNX1tky02n1", "003FTlCpBTM4eSqYSWPv4H", "1FMHNVeJ9s1x1l1WlaRs2I"] },
    { name: "Hot Milk", start: "18:30", end: "19:10", spotifyTrackIds: ["5Xr1q4GLTnNZu6c4K9rsNh", "0Z4AHhLtAentugT4qg2l7S", "25GUEgKT1JjCsk6DMf9KH8", "3FdI2uFUxKWm9kmPkIYYf3", "2RCaNOSgKFpCC8JE1RVlIo"] },
    { name: "Marmozets", start: "17:20", end: "18:00", spotifyTrackIds: ["3AXMbxZDGr3YQEdDBDbo2P", "34ywfaV8ZajQp0HhWYWsH2", "0B5vI3ok1yHPXsBKQP1xZd", "4X2aRld964jX3SN9hJSzYE", "44aso9vCh5fyt1OFp0XbDW"] },
    { name: "AS IT IS", start: "16:25", end: "16:55", spotifyTrackIds: ["4jBSolgoch9CLOS96SP3CX", "1TIBjAmf6B2K0xfcb7ja7r", "1ifG66jNkap7NFql3R0jot", "6a9pVxYMYbzacNlkOFEqgD", "05VE7unIMC8KBLDn6pgeP0"] },
    { name: "Melrose Avenue", start: "15:30", end: "16:00", spotifyTrackIds: ["4ip88W22vNrmZnRCZoP3XR", "1f2nhQZWeOJqACj8WW71Rw", "1qvPHDGsIPQBACafH7UFGF", "7lqcFJeWQmJ74lj7095GIa", "7rMUNBigPCfFdpRZuj8m9g"] },
    { name: "Mouth Culture", start: "14:35", end: "15:05", spotifyTrackIds: ["2tc97WIewRCpScw2jOf9QH", "7aJ6K3esJ9rvCwpgebFeBR", "5klhOR0OgxOLXlwP3JY7xi", "2XybqMpL67EfQErfR00HID", "34PAOBsQ9IZKGSPIkHanpY"] },
    { name: "Die Spitz", start: "13:40", end: "14:10", spotifyTrackIds: ["5EoE0FBnhcJ4rP6kyIkMx1", "7x7Ej1fQsdve9jNOvN0AOU", "2Zj1mz5b791QYiY388iBC5", "3cv5ykOxlEMFNeFG9uJyvQ", "2gaY4NhYEGJvxKbur1GKJE"] },
    { name: "Nevertel", start: "12:45", end: "13:15", spotifyTrackIds: ["07gPDviT2OdBj40dxqMmjO", "59PH8KgEIhxQYFcr7zDZ03", "117bZk1Y2LfrD9BDgj3a0I", "32FR6IBFhjy5WnxJ1eoWve", "2i5ARALsvCBHEhizeFDzMF"] },
    { name: "Frozemode", start: "11:50", end: "12:20", spotifyTrackIds: ["7qcif4D117Sy0S4HvT6FPp", "3Eg5COzRb2VPNDMeaoenAf", "7Enbwq0GYoBdcEQtAyD30R", "0rCHNHRd93LgnFXNrj1cJ3", "3ML0126IeEfdGfhfjFWlQp"] },
    { name: "Kerrang! Radio - The Deal Winner", start: "11:00", end: "11:20" },
  ], 800),
  ...addArtists("sunday", "avalanche", [
    { name: "SCOOTER", start: "20:20", end: "21:20", spotifyTrackIds: ["0p3YcSuJt07bB2z52Zm5V4", "6cu6vmqmmh4eMpuCwCv4k5", "0PasetpSG1E3BxoPZP5dy3", "1AVT4LSF2wd7kAzzB13aVs", "12ePPAOda2VA0XoULHLBrI"] },
    { name: "letlive.", start: "19:10", end: "19:50", spotifyTrackIds: ["3rY98pNrVY2OOacnbxbI0E", "7svxm1CamJHrlUqMfeuEFe", "3X5RmftMEqyDZ5w9G3u8eU", "425qQ4KCGz3oE9ag0JbhRU", "7DbD8h3cdBbylFtHH5xTAr"] },
    { name: "Ash", start: "18:00", end: "18:40", spotifyTrackIds: ["6F6BYzIHC0HvIvWtYGFGvY", "10B3eGl539TNdvxhvHITNx", "4VOsD6vWCLt7cBVOFBGS0S", "1J5qJYPN0vHu9VNOh2COhX", "2GnSkeHqW8XryuLrfx6DED"] },
    { name: "Dinosaur Pile-Up", start: "16:50", end: "17:30", spotifyTrackIds: ["6geuGKb1jKb6TV8sGE5eaC", "0RhYWcRxUljBv363WhAbtu", "2IeeVwZs1v8xitbnsaFHWS", "3ojjRvP2OTPp8PM4zNYQto", "3XgZv8J2mB73xJiDQ7MjgR"] },
    { name: "Magnolia Park", start: "15:50", end: "16:20", spotifyTrackIds: ["2KA4pe0ShmOyzjJAy22CbM", "6W9CY1yt4FoAi2vKiqQLz0", "01e7BHhJGVtH9a6HfwKFCl", "03hgA9bbWk17K66vN7wEzp", "3FJWujo6lhrjtS3w8rR78F"] },
    { name: "TX2", start: "14:50", end: "15:20", spotifyTrackIds: ["6ngJehVMhg3qftkSR3QOuS", "4wLIUQ6cBpSXYzcp8RzBBb", "5wW5TUdbZEe9mk1scB99X3", "7KaUkNQbd5PxL7nNMQyxCA", "7B8tGBbPdaP9qKAcRmZWsH"] },
    { name: "The Pretty Wild", start: "13:50", end: "14:20", spotifyTrackIds: ["0i681kxcGhZdB1ZoB22tHi", "48ISAGGJqX5MVnPRpKHAqF", "3jkh4Ddt5nSwcjBKjQovFQ", "5FQqZgYp7psty3P37ZMMi6", "0D3z7YrhFHbdahOjPbtByX"] },
    { name: "ivri", start: "12:50", end: "13:20", spotifyTrackIds: ["1Uss8Mkb9ce4oMtI68JYna", "4Z31SCV20NaLykGog1RyP8", "3JG9JpvaYjmq0i17qnu8y4", "3a2u2qDijKes0TpHczoVYB", "0En299cr1dLPBaZmonM1RA"] },
    { name: "Zero 9:36", start: "11:50", end: "12:20", spotifyTrackIds: ["0JXILsWNyXHEd2IzofS3jX", "5iaTwwgtEyJ7cy6lLTlGBb", "6MTfKxsjHEsH8GtHfKEXAA", "52jC5QLj1sazMXPIxl68l0", "1GodulW331hO1RQTf1KpjD"] },
    { name: "Mould", start: "11:00", end: "11:25", spotifyTrackIds: ["2jx1NtE9VnyNuyMqpoYEXw", "550zZVBWNMiYtCzeVsNkZ8", "0PBKBkw1n4Mj9ys7G5D3uR", "5dtlAWYwToorYnDT1iYO4q", "0esRRE1zv86UDi7y0KFXci"] },
  ], 900),
  ...addArtists("friday", "dogtooth", [
    { name: "Cavalera", start: "21:50", end: "22:50", spotifyTrackIds: ["3bSnE01X7tezLVR8ppZjvB", "1qVRv7ydm4sMj9aX5VYuN4", "5WElL3I3ukIPCP2pXjH2r5", "6lcsIkE5EnINvYJg3PczMj", "1TkZ5zd4E7GTaFCvV5VpdS"] },
    { name: "Corrosion of Conformity", start: "20:45", end: "21:20", spotifyTrackIds: ["6g48vpikqU2atsrDXdGzKo", "3CtKSQyQPdzA2u7n9tjJw2", "5Z7U8TRHAlX2uL2lVYv5Wa", "2tI78SEx3HpdqSdEG8G00L", "0Mj1guCpGjbw6pqBbAbfGa"] },
    { name: "BAND-MAID", start: "19:40", end: "20:15", spotifyTrackIds: ["130dsYbbXp9jQnETiJ7axI", "6Nawx5sqYFIbcx2qQgrA67", "2VxoDPnyxNF976DK9rlVU6", "0S6wuDXHdmsKetgEXEMgUh", "6RmznWIj65w4YPTcfVfmpt"] },
    { name: "Stampin' Ground", start: "18:45", end: "19:15", spotifyTrackIds: ["533jB4NDINZWGi6aZ2hqaP", "1reBWAuhOivffb47nXZQSC", "60hTifKRAW1FlInK6bH0oq", "7n4iVcgzS3iUedqk6u2HxV", "7GrGeAdjzsgbpitlLoId9k"] },
    { name: "THE PRIMALS", start: "17:50", end: "18:20", spotifyTrackIds: ["6g4uRXMevjSIk7eLfupCXw", "13j5CJZFeTRbJxPCLEXmv2", "6FP1T9IpMJTqI8Ykn9xGDn", "285aijRH1PVMZ2pqMcwEUM", "5ZMW1Tk9leLbRHRHMxuuCP"] },
    { name: "Lake Malice", start: "17:00", end: "17:25", spotifyTrackIds: ["0yg8FlUxh0GIpzzRpDywFd", "4Ft8VwrsSfGV2bXmWf51Kf", "07WabqSXNibyOSbvteeg70", "10d58mW3UzVjqU1CR6opaF", "2X2atb8ZLsELpsMBYlFSS2"] },
    { name: "Nasty", start: "16:10", end: "16:35", spotifyTrackIds: ["0BVDW5q3xgKiM1I9TF75i9", "0mzv8uqL4xG1GNJiPC0D3h", "5FQWkrXcQjbmTVgVWnP0Ed", "2n6AjDfGtLoxSSCul57lNC", "3yYAUWkXMYmXXxj1EG549a"] },
    { name: "vianova", start: "15:20", end: "15:45", spotifyTrackIds: ["0aZQKnLel3o8ztRHWvJaev", "7rvPUq1aEiKrPJckEwWwAm", "0ZnJwflZTxlQxtQOzRlRBL", "5M3BS7MOqMeCJ5xaVZEuGn", "19LMSiPAc1Prev4mLWdDFt"] },
    { name: "James and the Cold Gun", start: "14:30", end: "14:55", spotifyTrackIds: ["7wYjgczy3Qute7gcOGCsZA", "2neUwuCWNA2xGxJN4ylJdS", "0vzqYNaGtaWI8vwQ09RQxQ", "1pLIbMtWDbTu8AL2om5ooP", "771aGs6grkyjJtp31NohgT"] },
    { name: "Slay Squad", start: "13:45", end: "14:05", spotifyTrackIds: ["1JbKN4qeQnT4s4kppoQnoD", "1xcFAdPidRpZlMy1asSMMt", "6daxL3wGEekEI6RKxy8xRc", "4upNJiXkHxNlfRAqgwlMuE", "6qCajWM5wQ4843d77uzdHH"] },
    { name: "Headwreck", start: "13:00", end: "13:20", spotifyTrackIds: ["3ZGgCVs23qGv6b7LBtBNsr", "5IKqFu79gP7pbQeTnyDHHn", "0NjptczDZ04fsTyAjV98yE", "0GZnmWLBRdajBnIwKNGbiT", "0GSlS9G4TIAgyCxfzheJIN"] },
  ], 1000),
  ...addArtists("saturday", "dogtooth", [
    { name: "Blood Incantation", start: "20:30", end: "21:30", spotifyTrackIds: ["5oNdZWJIMiCbSQuaWc7G7E", "77EnjgcxEVog2LIgRnONbQ", "5BRka5jlioljvRzYcGBdLJ", "7bvkBpcJnYHCuiyoDk9t3l", "1fXcdmrYXXawtTz4DPjju4"] },
    { name: "Decapitated", start: "19:25", end: "20:00", spotifyTrackIds: ["6ELePWpAnvr6YueTV3JlIu", "1NODkudB2DhHEe8H3X3iFG", "4lNznSUjByH5zWpPZFFeff", "2I0caLwd3Rc84Hr147WH6S", "7E7PTZtF2LAgBvwubKAjNe"] },
    { name: "Elder", start: "18:25", end: "19:00", spotifyTrackIds: ["0aBBIonGDbOcEyntUARrUV", "0gMYjcuAwOcCBGruZqj14t", "4cQoLN88Czh68CjxwcUPVD", "3LxHb1rN9S7MsezJ4R7rQm", "6J97SAP1pdptS0u8sRinkH"] },
    { name: "Sweet Savage", start: "17:30", end: "18:00", spotifyTrackIds: ["5nQ9yhbHTxThaRKQLCr3QO", "4RPu9xMFs0vggIRGJFZFWy", "4FK4Z7CsIGXGfHZIJhfLFe", "5CGsUxYlOw9ErZkKcGELNf", "112sftv6Pia4v9PEandsvY"] },
    { name: "Self Deception", start: "16:40", end: "17:05", spotifyTrackIds: ["4rm1If4bXjLVO5zmex660Z", "2ZKYwK2Icv50QU156JORyQ", "2AGFAa6AwMqcFWj7YhUmSu", "7kED1qnduf7UbCq5KZqFVz", "7cBK7AcFMiOhCCfMyA0xba"] },
    { name: "As Everything Unfolds", start: "15:50", end: "16:15", spotifyTrackIds: ["15cliM4IVHGvwbK9O36xcV", "6YU6i0opuUWkxPnpiOuFWE", "63pw1pS2bbycD2HCXtDTDl", "467VEGGO5IzK9Lh2XrCtLy", "3zx6JVZolcGCJzMTVFsOvE"] },
    { name: "Return To Dust", start: "15:00", end: "15:25", spotifyTrackIds: ["1cOVUfTywcWYUBPtzpaIDB", "7zUAKqKtqpGNNN0drkJGDS", "3UHE8bxJihjE8WJHklarFG", "0suR0ZWls0EHG9VfPaVq31", "3BXgm8kEDnAOdEXcA6Ibww"] },
    { name: "Conjurer", start: "14:10", end: "14:35", spotifyTrackIds: ["0N0PTWhyTlWy4nVZmRQNBA", "0bKel3VqHu6roTAhRhqYxc", "5stS6O7QWHjZ8UttIqaWr0", "5sVWqiYsRplqAArPX24JtZ", "6TdSi8WykOzSSNbuWxFa4j"] },
    { name: "Lowen", start: "13:20", end: "13:45", spotifyTrackIds: ["5tCrxVlJHVJNRM2TrzqyWc", "1DgjkRkiSozHVBvMfb6VGt", "238mrt8xD0GAyDHmzOEgR7", "7zTwrk3id0tFPFeUa6nG8B", "2dDlikmXjAxdPEdmxB3UEJ"] },
    { name: "TAILGUNNER", start: "12:30", end: "12:55", spotifyTrackIds: ["4iFia8akb1OC1Xh7Tz18WG", "68S7piYEPg64QLK0CnnDM4", "1ixF7nuStVtMkShEfN7xeL", "6wYllYVALhaX1cAvYgeXVf", "3fgNwjma5N5CUvq6o4uhGO"] },
    { name: "Tropic Gold", start: "11:45", end: "12:05", spotifyTrackIds: ["21Lwloi3hp3tEGLiudmS6D", "4MreDsW27Y0RcvdGAYNqEk", "5CuN6SEX52Kf2OgNGv7zee", "5Kf9SEEvbmjLBts6NRamjO", "5CcJq7qz9fLKaA6DLpffeF"] },
    { name: "PUSSYLIQUOR", start: "11:00", end: "11:20", spotifyTrackIds: ["5ClPctYS0uzC0PmjOEr9xF", "47qX15IxtYxr5NzRvtAMxr", "19AIoNNDjfFHDitRbKRkwO", "4N1AjiD7gdGFuuQ0YxYOaq", "5LZMqwSgFfDqdjkebhtOXI"] },
  ], 1100),
  ...addArtists("sunday", "dogtooth", [
    { name: "Static-X", start: "20:30", end: "21:30", spotifyTrackIds: ["6O7pihLJgeqxUnG7u9oYL2", "35ZmCVnfYRdK1iLGCxNhMa", "6BZ5pRMvPfxsJLLeztmme5", "6uOzYMGucTA0MAFwS2FNB2", "6doZryBQYC5hQJdx1lyc2W"] },
    { name: "Spineshank", start: "19:25", end: "20:00", spotifyTrackIds: ["5xqi4X6J5PHwndSJc7YLYH", "3asnOjUfw1kI8DRwM7Atxx", "2xV28mhkI7AzwpJEqPGSb3", "2wdjEAsK64EUPmNIIH6MWt", "7f5MUiAjTjI3EORH0LO5xJ"] },
    { name: "Gatecreeper", start: "18:25", end: "18:55", spotifyTrackIds: ["5XDoERRDfIlN16fhWH1vqd", "2DcfxCoU8ICZ4RYzJSoaDH", "2uSQwNx0A61vBI2XePH1a8", "1KmDA9qmckAZt6jjDj3eEy", "6Bs4bgfIsNZOuREbHdjmyW"] },
    { name: "Boundaries", start: "17:30", end: "18:00", spotifyTrackIds: ["3a4hyzZpwzXclpN65pcLbP", "2xIOwvCHn0slOK518G4WFY", "7FXvVh5vQU1WBQwf1MkuFi", "4fs3UmbirsadoeW8yd8S1M", "4HVy83HGp8YeoHl51BB60m"] },
    { name: "ANKOR", start: "16:40", end: "17:05", spotifyTrackIds: ["1LpVyjzkWhWXqN1uoJ9j1e", "6dUJP62raX7sCxWD0Kf3u0", "1DHbRaVkKEUneuzlVN4Yoc", "2GkQwyjE21w6ewCXxUywAR", "5MHnHbdB2q6RvwUYg5t3MS"] },
    { name: "Annisokay", start: "15:00", end: "15:25", spotifyTrackIds: ["0X6WHH6WvXFTMmwWrsFeob", "5fXqeLjrxoR48qgHZGlfXz", "4BvQAevACSYvH09CeAELBb", "7AvbPuycvrwFgbcL8mUmie", "7tWeQHYHpodXBZrMnXGBQY"] },
    { name: "Last Train", start: "14:10", end: "14:35", spotifyTrackIds: ["7yfd1trP4kvqLJVY97qxHw", "6OBbrTbp27WfGk2zO1DaNy", "0RYCZ8KoZ5UrvVJsEXTiTM", "4MaRpIjn9BAgS7d1wm3vwS", "6fwEYnNeMzMmQqzOuSNvQ6"] },
    { name: "Decessus", start: "13:20", end: "13:45", spotifyTrackIds: ["2pjlasonZyNgWiZGNlUa7b", "3QOpROhrfN6aYkqdoVy5lm", "6KXCETCc2fHN9D3hvIaFgn", "2DsK260zUUC57zICpi00Ce", "0kQji4Th3U4MdBJLuojrKr"] },
    { name: "Wayside", start: "12:30", end: "12:55", spotifyTrackIds: ["1ZbV4k4Wmlak6USIovaob2", "4DzKsnD6cZyI9Pc53cbBD6", "26haQh7H28301Z7petISZ4", "2540RWLyWikRQSg0HAoE3P", "7Fg6PgHG94PKxcN0cNRcJP"] },
    { name: "Private School", start: "11:45", end: "12:05", spotifyTrackIds: ["0Nig5iLfz3PGc2N1arz1j8", "144ItIFIWau6h80Glf6eUw", "6QysPkrizgWQRtZMYnkyfR", "5Who33byRO15WEPSuO83IM", "4O8btG65d0vfUcfkuPDj5w"] },
    { name: "Spitting Glass", start: "11:00", end: "11:20", spotifyTrackIds: ["3YljlwPWa7J7kxl1gm2NQL"] },
  ], 1200),
  ...addArtists("wednesday", "district-doghouse", [
    { name: "40000 Leagues", start: "16:00", end: "16:25" },
    { name: "Celavi", start: "16:30", end: "16:55" },
    { name: "Pryma", start: "17:05", end: "17:35" },
    { name: "DeadWax", start: "17:45", end: "18:20" },
    { name: "RXPTRS", start: "18:30", end: "19:15" },
    { name: "Black Water County", start: "19:25", end: "20:25" },
    { name: "Tasmin Taylor", start: "20:30", end: "21:00" },
    { name: "Andrew O'Neill: A History Of Punk", start: "21:00", end: "22:00" },
    { name: "Tasmin Taylor", start: "22:00", end: "22:30" },
    { name: "Nic Cage Against The Machine", start: "22:30", end: "23:00" },
    { name: "Tasmin Taylor", start: "23:00", end: "00:00" },
    { name: "STVW", start: "00:00", end: "02:00" },
    { name: "Savannah", start: "02:00", end: "03:00" },
  ], 1300),
  ...addArtists("thursday", "district-doghouse", [
    { name: "RockFit", start: "10:00", end: "11:00" },
    { name: "Kyden Fire", start: "12:00", end: "13:00" },
    { name: "Heavy Metal Sports", start: "13:00", end: "14:30" },
    { name: "Kyden Fire", start: "14:30", end: "15:00" },
    { name: "James B. Partridge's Primary School Bangers", start: "15:00", end: "16:00" },
    { name: "Kyden Fire", start: "16:00", end: "16:30" },
    { name: "Electric Six", start: "16:30", end: "17:30" },
    { name: "Kyden Fire", start: "17:30", end: "18:00" },
    { name: "Famous First Words", start: "18:00", end: "20:30" },
    { name: "Kyden Fire", start: "20:30", end: "21:00" },
    { name: "Bat Sabbath", start: "21:00", end: "22:00" },
    { name: "Kyden Fire", start: "22:00", end: "22:30" },
    { name: "Five", start: "22:30", end: "23:00" },
    { name: "Kyden Fire", start: "23:00", end: "23:30" },
    { name: "Heavy Metal Time Machine", start: "23:30", end: "02:00" },
    { name: "Nickelbrat", start: "02:00", end: "03:00" },
  ], 1400),
  ...addArtists("friday", "district-doghouse", [
    { name: "RockFit", start: "11:00", end: "12:00" },
    { name: "Black Parade", start: "22:00", end: "23:30" },
    { name: "Chop Suey", start: "23:30", end: "00:00" },
    { name: "Dick & Dom DJ Set", start: "00:00", end: "01:00" },
    { name: "Chop Suey", start: "01:00", end: "01:30" },
    { name: "Creeper DJ Set", start: "01:30", end: "02:30" },
    { name: "Chop Suey", start: "02:30", end: "03:00" },
  ], 1500),
  ...addArtists("saturday", "district-doghouse", [
    { name: "RockFit", start: "11:00", end: "12:00" },
    { name: "Gemma Edwards", start: "22:00", end: "23:15" },
    { name: "Lucas Woodland from Holding Absence", start: "23:15", end: "00:15" },
    { name: "Gemma Edwards", start: "00:15", end: "00:30" },
    { name: "The All American Rejects", start: "00:30", end: "01:00" },
    { name: "Gemma Edwards", start: "01:00", end: "01:30" },
    { name: "Modestep DJ Set", start: "01:30", end: "03:00" },
  ], 1600),
  ...addArtists("sunday", "district-doghouse", [
    { name: "RockFit", start: "11:00", end: "12:00" },
    { name: "Kickstart My Heart", start: "22:00", end: "23:30" },
    { name: "End Of The World Party", start: "23:30", end: "03:00" },
  ], 1700),
  ...addArtists("wednesday", "district-den", [
    { name: "Matt Reid", start: "14:00", end: "14:15" },
    { name: "Rich Wilson", start: "14:15", end: "14:30" },
    { name: "Tom Wrigglesworth", start: "14:30", end: "14:45" },
    { name: "Harriett Dyer", start: "14:45", end: "15:00" },
    { name: "Matt Price", start: "15:00", end: "15:15" },
    { name: "Felicity Ward", start: "15:15", end: "15:30" },
    { name: "Matt Stellingwerf", start: "15:30", end: "16:00" },
    { name: "Peter Brush", start: "16:00", end: "16:15" },
    { name: "Geoff Norcott", start: "16:15", end: "16:30" },
    { name: "Dave Fulton", start: "16:30", end: "16:45" },
    { name: "Thomas Green", start: "16:45", end: "17:00" },
    { name: "Dave Longley", start: "18:00", end: "18:15" },
    { name: "Frisian Shah", start: "18:15", end: "18:30" },
    { name: "Joe Wells", start: "18:30", end: "18:45" },
    { name: "Eddy Brimson", start: "18:45", end: "19:00" },
    { name: "Thor Stenhaug", start: "19:00", end: "19:15" },
    { name: "Stephen Bailey", start: "19:15", end: "19:30" },
    { name: "Sully O'Sullivan", start: "19:30", end: "19:45" },
    { name: "Jordan Gray's Comedy Club", start: "20:00", end: "20:15" },
    { name: "She They Press Play Showcase", start: "21:30", end: "22:00" },
    { name: "TokenGrass", start: "22:00", end: "22:55" },
    { name: "She They Press Play Showcase", start: "23:00", end: "23:30" },
    { name: "Bongo's Bingo", start: "23:30", end: "01:00" },
    { name: "She They Press Play Showcase", start: "01:00", end: "03:00" },
  ], 1800),
  ...addArtists("thursday", "district-den", [
    { name: "RuMac", start: "11:00", end: "12:00" },
    { name: "Kerrang! Radio's", start: "12:30", end: "13:30" },
    { name: "Danny Mc", start: "14:00", end: "14:15" },
    { name: "Leroy Brito", start: "14:15", end: "14:30" },
    { name: "Brennan Reece", start: "14:30", end: "14:45" },
    { name: "Tom Taylor", start: "14:45", end: "15:00" },
    { name: "Bobby Mair", start: "15:00", end: "15:15" },
    { name: "Matt Bragg", start: "15:15", end: "15:30" },
    { name: "Kate Lucas", start: "15:30", end: "16:00" },
    { name: "Garrett Millerick", start: "16:00", end: "16:15" },
    { name: "Sikisa", start: "16:15", end: "16:30" },
    { name: "Mick Ferry", start: "16:30", end: "16:45" },
    { name: "Jordan Gray", start: "16:45", end: "17:00" },
    { name: "Dave Hill", start: "17:30", end: "18:00" },
    { name: "Dave Hill", start: "18:15", end: "18:45" },
    { name: "Dinesh Nathan", start: "18:45", end: "19:00" },
    { name: "Hatty Preston", start: "19:00", end: "19:15" },
    { name: "Markus Birdman", start: "19:15", end: "19:30" },
    { name: "Liam Farrelly", start: "19:30", end: "19:45" },
    { name: "Cary Marx", start: "19:45", end: "20:00" },
    { name: "Cray Cray Cabaret", start: "20:15", end: "20:30" },
    { name: "Alex Baker", start: "21:30", end: "22:00" },
    { name: "Dune Rats", start: "22:00", end: "23:00" },
    { name: "Alex Baker", start: "23:00", end: "23:30" },
    { name: "Bongo's Bingo", start: "23:30", end: "01:00" },
    { name: "Liam Cormier", start: "01:00", end: "03:00" },
  ], 1900),
  ...addArtists("friday", "district-den", [
    { name: "Rock Kids", start: "10:00", end: "11:00" },
    { name: "Fat Lip", start: "23:00", end: "00:00" },
    { name: "Fat Lip", start: "00:30", end: "01:00" },
    { name: "Face Down Remix Challenge", start: "01:00", end: "02:00" },
    { name: "Face Down", start: "02:00", end: "03:00" },
  ], 2000),
  ...addArtists("saturday", "district-den", [
    { name: "Rock Kids", start: "10:00", end: "11:00" },
    { name: "NEXT GEN", start: "23:00", end: "00:00" },
    { name: "NEXT GEN", start: "00:30", end: "01:00" },
    { name: "Frozemode", start: "01:00", end: "01:30" },
    { name: "Master of Pop Hits", start: "01:30", end: "03:00" },
  ], 2100),
  ...addArtists("sunday", "district-den", [
    { name: "Rock Kids", start: "10:00", end: "11:00" },
    { name: "Sophie K", start: "23:00", end: "00:00" },
    { name: "Sophie K", start: "00:30", end: "01:30" },
  ], 2200),
  ...addArtists("wednesday", "district-ace-spades", [
    { name: "Panic! At The Bingo", start: "15:00", end: "17:00" },
    { name: "Chris Fleming Millennial Magician", start: "17:30", end: "18:30" },
    { name: "Sappenin' Podcast", start: "19:00", end: "20:00" },
    { name: "Live Band Karaoke with Ten Years Too Late", start: "20:30", end: "22:30" },
    { name: "Silent Disco - Attitude Era vs Soundtrax", start: "23:00", end: "01:00" },
    { name: "Silent Disco - Metalcore vs Hair Metal", start: "01:00", end: "03:00" },
  ], 2300),
  ...addArtists("thursday", "district-ace-spades", [
    { name: "MEYBA Football Quiz", start: "10:30", end: "12:00" },
    { name: "Panic! At The Bingo", start: "13:30", end: "15:30" },
    { name: "The Metal Roundup Podcast", start: "16:00", end: "17:00" },
    { name: "Never Mind The Download Pub Quiz", start: "19:00", end: "21:00" },
    { name: "Ace Of Slays", start: "21:30", end: "23:00" },
    { name: "Silent Disco - Ozzy & Black Sabbath vs Back to the Beginning Bands", start: "23:30", end: "01:00" },
    { name: "Silent Disco - Buffy vs Twilight", start: "01:00", end: "02:00" },
    { name: "Silent Disco - Disney vs Dad Rock", start: "02:00", end: "03:00" },
  ], 2400),
  ...addArtists("friday", "district-ace-spades", [
    { name: "Download Family Feud", start: "11:00", end: "12:00" },
    { name: "OCT (On Company Time)", start: "23:30", end: "00:15" },
    { name: "Silent Disco - K-Pop vs Emo", start: "01:00", end: "03:00" },
  ], 2500),
  ...addArtists("saturday", "district-ace-spades", [
    { name: "ADHD Love", start: "10:30", end: "11:30" },
    { name: "Silent Disco - System of a Down vs Slipknot", start: "23:00", end: "00:00" },
    { name: "Silent Disco - Metallica vs AC/DC", start: "00:00", end: "01:00" },
    { name: "Silent Disco - Avril vs Blink", start: "01:00", end: "02:00" },
    { name: "Silent Disco - My Chemical Romance vs The Used", start: "02:00", end: "03:00" },
  ], 2600),
  ...addArtists("sunday", "district-ace-spades", [
    { name: "Download Family Feud", start: "11:00", end: "12:00" },
    { name: "Silent Disco - Football Anthems vs Power Anthems", start: "23:00", end: "01:00" },
    { name: "Silent Disco - DL26 Pre-2000 vs DL26 Post-2000", start: "01:00", end: "03:00" },
  ], 2700),
  ...addArtists("wednesday", "district-outpost", [
    { name: "School of Rock", start: "13:00", end: "21:00" },
  ], 2800),
  ...addArtists("thursday", "district-outpost", [
    { name: "Flowstate", start: "10:00", end: "11:30" },
    { name: "School of Rock", start: "12:00", end: "20:00" },
    { name: "London Short Film Festival", start: "21:30", end: "23:00" },
  ], 2900),
  ...addArtists("friday", "district-outpost", [
    { name: "Flowstate", start: "09:00", end: "10:30" },
  ], 3000),
  ...addArtists("saturday", "district-outpost", [
    { name: "Flowstate", start: "09:00", end: "10:30" },
  ], 3100),
  ...addArtists("sunday", "district-outpost", [
    { name: "Flowstate", start: "09:00", end: "10:30" },
  ], 3200),
  ...addArtists("wednesday", "rip-courtyard", [
    { name: "Nephwrack", start: "15:45", end: "16:30" },
    { name: "Cwfen", start: "17:00", end: "17:45" },
    { name: "The Howling", start: "18:15", end: "19:00" },
    { name: "Knives", start: "19:30", end: "20:15" },
    { name: "Margarita Witch Cult", start: "20:45", end: "21:30" },
    { name: "Split Dogs", start: "22:00", end: "23:00" },
  ], 3300),
  ...addArtists("thursday", "rip-courtyard", [
    { name: "The LoadDown Podcast", start: "14:00", end: "14:45" },
    { name: "Outlander", start: "15:45", end: "16:30" },
    { name: "Silo", start: "17:00", end: "17:45" },
    { name: "Mallavora", start: "18:15", end: "19:00" },
    { name: "Creeping Jean", start: "19:30", end: "20:15" },
    { name: "Tropic Gold", start: "20:45", end: "21:30" },
    { name: "Riding The Low", start: "22:00", end: "23:00" },
  ], 3400),
];

export const isDistrictXArtist = (artist: Artist) =>
  districtXDays.some((day) => day.id === artist.day) ||
  districtXStages.some((stage) => stage.id === artist.stage);

export const getLineup = (includeDistrictX = false) =>
  includeDistrictX ? lineup : lineup.filter((artist) => !isDistrictXArtist(artist));

export const artistById = new Map(lineup.map((artist) => [artist.id, artist]));

export const dayById = new Map(allFestivalDays.map((day) => [day.id, day]));

export const stageById = new Map(allFestivalStages.map((stage) => [stage.id, stage]));

export const getArtistById = (id: string | undefined) => (id ? artistById.get(id) : undefined);

export const getDay = (id: DayId) => dayById.get(id);

export const getStage = (id: StageId) => stageById.get(id);
