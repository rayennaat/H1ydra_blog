import {
	LinkPreset,
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";
import { siteConfig } from "./siteConfig";

// 根据页面开关动态生成导航栏配置
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: (NavBarLink | LinkPreset)[] = [
		// 主页
		LinkPreset.Home,

		// 归档
		LinkPreset.Archive,
	];

	// 根据配置决定是否添加友链，在siteConfig关闭pages.friends时导航栏不显示友链
	// 根据配置决定是否添加留言板，在siteConfig关闭pages.guestbook时导航栏不显示留言板
	if (siteConfig.pages.guestbook) {
		links.push({
			name: "Notes",
			url: "/guestbook/",
			icon: "material-symbols:chat",
		});
	}

	links.push({
		name: "Other",
		url: "/my/",
		icon: "material-symbols:apps",
		children: [
			...(siteConfig.pages.anime
				? [
						{
							name: "MyAnimeList",
							url: "/anime/",
							icon: "material-symbols:animation",
						},
					]
				: []),

			// 根据配置决定是否添加番组计划，在siteConfig关闭pages.bangumi时导航栏不显示番组计划
			...(siteConfig.pages.bangumi ? [LinkPreset.Bangumi] : []),

			...(siteConfig.pages.tmdb
				? [
						{
							name: "TMDB",
							url: "/tmdb/",
							icon: "material-symbols:movie",
						},
					]
				: []),
		],
	});

	links.push(LinkPreset.About);

	links.push({
		name: "Links",
		url: "/links/",
		icon: "material-symbols:link",

		// 子菜单
		children: [
			{
				name: "GitHub",
				url: "https://github.com/rayennaat",
				external: true,
				icon: "fa7-brands:github",
			},
			{
				name: "LinkedIn",
				url: "https://www.linkedin.com/in/rayennaat/",
				external: true,
				icon: "fa7-brands:linkedin",
			},
		],
	});

	// 仅返回链接，其它导航搜索相关配置在模块顶层常量中独立导出
	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
