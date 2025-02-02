import type { Metadata } from "next"
import { Toaster } from 'react-hot-toast'
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { Menu } from "@/components/Menu"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"]
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"]
})

export const metadata: Metadata = {
	title: "Demo app",
	description: "Demo app"
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="pt-br">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col items-center`}
			>
				<Menu />

				{children}

				<Toaster
					position="bottom-center"
				/>
			</body>
		</html>
	)
}
