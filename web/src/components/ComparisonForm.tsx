'use client'

import { ChangeEvent, useContext, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import classnames from 'classnames'
import { GlobalContext } from '@/contexts/GlobalContext'
import { delay } from '@/utils/delay'

interface FormProps {
	identifier: string
}

export function ComparisonFunction() {
	const { socketInstance } = useContext(GlobalContext)

	const [file, setFile] = useState<File | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [result, setResult] = useState<boolean | null>(null)

	async function handleSubmit(values: FormProps) {
		try {
			if(!socketInstance) {
				throw new Error('Socket não definido!')
			}

			socketInstance.connect()

			await delay()

			const { identifier } = values
			
			const formData = new FormData()

			formData.append('identifier', identifier)
			
			if(!file) {
				console.log('Imagem não anexada.')
				return
			}

			formData.append('file', file)
			formData.append('socket_id', String(socketInstance.id))

			toast('Comparação iniciada. Aguarde...')

			setIsProcessing(true)

			const { data } = await axios.post('http://localhost:3360/compare', formData)

			if(data.message) {
				throw new Error(data.message)
			}

			
		} catch(e) {
			console.log(e)
			toast((e as Error).message)
		}
	}

	const isResultDefined = result !== null

	return (
		<Formik
			onSubmit={handleSubmit}
			initialValues={{
				identifier: ''
			}}
		>
			{({ resetForm }) => (
				<Form className="flex flex-col gap-4">
					<h1 className="font-bold text-lg text-center">Autenticação</h1>

					<label
						htmlFor="file-2"
						className="py-2 px-4 bg-white rounded-md h-11 text-slate-800 flex items-center"
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

							setFile(file)
						}}
					/>

					<Field name="identifier" className="py-2 px-4 rounded-md h-11 text-slate-800 outline-none" placeholder="Identificador da pessoa" />

					<button
						type="submit"
						className="py-2 px-4 bg-white text-slate-800 rounded-md disabled:opacity-80"
						disabled={isProcessing || isResultDefined}
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

							{/* <span className="text-sm font-bold">{resultTimeoutValue / 1000} segundo(s)</span> */}
						</div>
					) : null}

					{isResultDefined && (
						<button
							type="button"
							className="py-2 px-4 bg-white text-slate-800 rounded-md"
							onClick={() => {
								resetForm()

								setFile(null)
								setResult(null)
								setIsProcessing(false)
							}}
						>
							Limpar
						</button>
					)}
				</Form>
			)}
		</Formik>
	)
}