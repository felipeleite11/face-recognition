'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import classnames from 'classnames'
import { useDebouncedCallback } from 'use-debounce'
import { connectSocket, socket } from '@/config/socket'
import { api } from '@/config/api'

interface FormProps {
	identifier: string
}

export function ComparisonForm() {
	const [file, setFile] = useState<File | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [result, setResult] = useState<boolean | null>(null)
	const [comparisonURLPreview, setComparisonURLPreview] = useState<string | null>(null)
	const [referenceURLPreview, setReferenceURLPreview] = useState<string | null>(null)

	async function handleSubmit(values: FormProps) {
		try {
			const { identifier } = values

			if (!file) {
				console.log('Imagem não anexada.')
				return
			}

			if (!identifier) {
				console.log('Identificador não informado.')
				return
			}

			await connectSocket()

			setIsProcessing(true)

			const formData = new FormData()

			formData.append('identifier', identifier)
			formData.append('file', file)
			formData.append('socket_id', String(socket.id))

			const { data } = await api.post('compare', formData)

			if (data.message) {
				throw new Error(data.message)
			}

			if (data.id) {
				toast.success(`ID: ${data.id}`)
			}
		} catch (e) {
			console.log(e)

			toast((e as Error).message)
		}
	}

	const handleReferenceChange = useDebouncedCallback(async (identifier: string) => {
		try {
			const { data } = await api.get<{ reference: string }>(`reference/${identifier}`)

			setReferenceURLPreview(data.reference)
		} catch (e) {
			const statusError = (e as AxiosError).response?.status

			if (statusError === 404) {
				toast.error('Nenhuma imagem de referência associada a este identificador.')

				return
			}

			console.log(e)

			toast.error('Erro ao identificar imagem de referência.')
		}
	}, 1000)

	useEffect(() => {
		socket.on('status_change', status => {
			console.log('Status change:', status)

			if (status === 'done') {
				setIsProcessing(false)
			}
		})

		socket.on('result', result => {
			console.log('Result: ', result)

			socket.disconnect()

			setResult(result.isMatch)
		})

		return () => {
			socket.off('status_change')
			socket.off('result')
		}
	}, [])

	const isResultDefined = result !== null

	return (
		<div className="w-[50%] flex justify-center">
			<Formik
				onSubmit={handleSubmit}
				initialValues={{
					identifier: ''
				}}
			>
				{({ resetForm, setFieldValue }) => (
					<Form className="flex flex-col gap-4 w-[40rem] items-center">
						<h1 className="font-bold text-lg text-center">Autenticação</h1>

						{comparisonURLPreview && (
							<img src={comparisonURLPreview} alt="" className="w-56 rounded-md" />
						)}

						<label
							htmlFor="file-2"
							className="py-2 px-4 bg-white rounded-md h-11 text-slate-800 flex items-center w-full"
						>
							<span className={classnames({
								'opacity-60': !file?.name,
								'opacity-100': !!file?.name
							})}>
								{file?.name || 'Selecione a imagem'}
							</span>
						</label>

						<input
							id="file-2"
							type="file"
							className="hidden"
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								const file = e.currentTarget.files?.[0] || null

								if (file) {
									const url = URL.createObjectURL(file)

									setComparisonURLPreview(url)
									setFile(file)
								}
							}}
						/>

						<Field
							name="identifier"
							className="py-2 px-4 rounded-md h-11 text-slate-800 outline-none w-full"
							placeholder="Identificador da pessoa"
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								const value = e.target.value

								setFieldValue('identifier', value)

								handleReferenceChange(value)
							}}
						/>

						{referenceURLPreview && (
							<img src={referenceURLPreview} alt="" className="w-56 rounded-md" />
						)}

						<button
							type="submit"
							className="py-2 px-4 bg-white text-slate-800 rounded-md disabled:opacity-80 w-full"
							disabled={isProcessing || isResultDefined || !referenceURLPreview || !comparisonURLPreview}
						>
							Autenticar
						</button>

						{result === true ? (
							<div className="flex flex-col items-center justify-center text-white text-sm">
								<Image src="/success.gif" alt="" width={80} height={80} />
								<span>Autenticado com sucesso!</span>
							</div>
						) : result === false ? (
							<div className="flex flex-col items-center justify-center text-white text-sm">
								<Image src="/fail.gif" alt="" width={80} height={80} />
								<span>Falha na autenticação!</span>
							</div>
						) : isProcessing ? (
							<div className="flex flex-col items-center justify-center text-white text-sm">
								<Image src="/loading.gif" alt="" width={80} height={80} />
								<span>Analisando...</span>
							</div>
						) : null}

						{isResultDefined && (
							<button
								type="button"
								className="py-2 px-4 bg-white text-slate-800 rounded-md w-full"
								onClick={() => {
									resetForm()

									setFile(null)
									setResult(null)
									setIsProcessing(false)
									setComparisonURLPreview(null)
									setReferenceURLPreview(null)
								}}
							>
								Limpar
							</button>
						)}
					</Form>
				)}
			</Formik>
		</div>
	)
}