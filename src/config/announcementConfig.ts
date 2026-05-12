import type { AnnouncementConfig } from "../types/config";

export const announcementConfig: AnnouncementConfig = {
	title: "Announcement",

	content: "Welcome to my blog. This is a sample announcement.",

	// 是否允许用户关闭公告
	closable: true,

	link: {
		// 启用链接
		enable: true,
		// 链接文本
		text: "Learn more",
		// 链接 URL
		url: "/about/",
		// 内部链接
		external: false,
	},
};
