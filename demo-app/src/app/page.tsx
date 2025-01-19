import { ComparisonFunction } from '@/components/ComparisonForm'
import { ReferenceForm } from '@/components/ReferenceForm'

export default function Home() {
	return (
		<main className="flex justify-center gap-4 py-16">
			<ReferenceForm />

			<div className="h-screen w-[1px] bg-white" />

			<ComparisonFunction />
		</main>
	)
}
