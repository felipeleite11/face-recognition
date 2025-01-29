import Link from "next/link";

export function Menu() {
	return (
		<nav className="flex gap-12">
			<Link href="/reference">
				Imagem de referência
			</Link>

			<Link href="/comparison">
				Autenticação
			</Link>
		</nav>
	)
}