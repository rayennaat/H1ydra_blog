import { siteConfig } from "@/config";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const fields = [
	"list_status",
	"mean",
	"media_type",
	"num_episodes",
	"start_date",
	"end_date",
	"status",
	"genres",
	"studios",
].join(",");

type AnimeStatus = "watching" | "completed" | "plan_to_watch";
type MalAnimeItem = {
	list_status?: {
		status?: AnimeStatus;
		updated_at?: string;
	};
	node: {
		id: number;
		title: string;
	};
};
type MalAnimeListResponse = {
	data?: MalAnimeItem[];
	paging?: {
		next?: string;
	};
};

function getMalClientId() {
	return (
		import.meta.env.MAL_CLIENT_ID ||
		process.env.MAL_CLIENT_ID ||
		import.meta.env.PUBLIC_MAL_CLIENT_ID ||
		readEnvFileValue("MAL_CLIENT_ID") ||
		readEnvFileValue("PUBLIC_MAL_CLIENT_ID") ||
		""
	);
}

function readEnvFileValue(key: string) {
	const envPath = join(process.cwd(), ".env");
	if (!existsSync(envPath)) return "";

	const line = readFileSync(envPath, "utf-8")
		.split(/\r?\n/)
		.find((entry) => entry.trim().startsWith(`${key}=`));

	if (!line) return "";

	const value = line.slice(line.indexOf("=") + 1).trim();
	return value.replace(/^['"]|['"]$/g, "");
}

async function fetchStatus(
	username: string,
	clientId: string,
	status: AnimeStatus,
) {
	const collected: MalAnimeItem[] = [];
	let nextUrl: URL | null = new URL(
		`https://api.myanimelist.net/v2/users/${encodeURIComponent(username)}/animelist`,
	);
	nextUrl.searchParams.set("status", status);
	nextUrl.searchParams.set("sort", "list_updated_at");
	nextUrl.searchParams.set("limit", "100");
	nextUrl.searchParams.set("fields", fields);

	while (nextUrl) {
		const response = await fetch(nextUrl.toString(), {
			headers: {
				"X-MAL-CLIENT-ID": clientId,
			},
		});

		if (!response.ok) {
			throw new Error(`MAL returned ${response.status} for ${status}`);
		}

		const payload = (await response.json()) as MalAnimeListResponse;
		collected.push(...(payload.data || []));
		nextUrl = payload.paging?.next ? new URL(payload.paging.next) : null;
	}

	return collected;
}

export async function GET() {
	const username = siteConfig.anime?.username ?? "";
	const statuses = siteConfig.anime?.statuses ?? [
		"watching",
		"completed",
		"plan_to_watch",
	];
	const clientId = getMalClientId();

	if (!username || !clientId) {
		return new Response(
			JSON.stringify({
				configured: false,
				items: [],
				message:
					"Add MAL_CLIENT_ID to .env and set siteConfig.anime.username.",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const groups = await Promise.all(
			statuses.map((status) => fetchStatus(username, clientId, status)),
		);
		const items = groups.flat().sort((a, b) => {
			const aTime = Date.parse(a.list_status?.updated_at || "");
			const bTime = Date.parse(b.list_status?.updated_at || "");
			return bTime - aTime;
		});

		return new Response(
			JSON.stringify({
				configured: true,
				items,
				updatedAt: new Date().toISOString(),
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("[MAL] Failed to load anime list:", error);

		return new Response(
			JSON.stringify({
				configured: true,
				items: [],
				message:
					"Check that the MAL client ID is valid and that your anime list is public.",
			}),
			{
				status: 502,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
