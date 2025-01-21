export async function delay(timeout: number = 2000) {
	await new Promise(r => setTimeout(r, timeout))
}