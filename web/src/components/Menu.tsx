import Link from "next/link";

export function Menu() {
	return (
		<nav className="flex gap-12 mb-16 justify-center py-4">
			<Link href="/reference">
				Imagem de referência
			</Link>

			<Link href="/comparison">
				Autenticação
			</Link>
		</nav>
	)
}