'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import axios from 'axios'
import toast from 'react-hot-toast'
import Image from 'next/image'
import classnames from 'classnames'

interface FormProps {
	identifier: string
}

let checkResultInterval: NodeJS.Timeout
const resultTimeout = 25000

export function ComparisonFunction() {
	const [file, setFile] = useState<File | null>(null)
	const [id, setId] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [result, setResult] = useState<boolean | null>(null)
	const [resultTimeoutValue, setResultTimeoutValue] = useState(resultTimeout)

	async function handleSubmit(values: FormProps) {
		try {
			const { identifier } = values
			
			const formData = new FormData()

			formData.append('identifier', identifier)
			
			if(!file) {
				console.log('Imagem não anexada.')
				return
			}

			formData.append('file', file)

			toast('Comparação iniciada. Aguarde...')

			setIsProcessing(true)

			const { data } = await axios.post('http://localhost:3360/compare', formData)

			if(data.message) {
				throw new Error(data.message)
			}

			setId(data.id)
		} catch(e) {
			console.log(e)
			toast((e as Error).message)
		}
	}

	async function checkResult() {
		try {
			console.log('Verificando resultado...')

			const { data } = await axios.get(`http://localhost:3360/result/${id}`)
	
			console.log('resultado', data)

			setResult(data.isMatch)

			setResultTimeoutValue(resultTimeout)
		} catch(e) {
			toast((e as Error).message)
		} finally {
			setIsProcessing(false)
		}
	}

	useEffect(() => {
		if(id) {
			checkResultInterval = setTimeout(checkResult, resultTimeout)

			setInterval(() => {
				setResultTimeoutValue(old => old >= 1000 ? old - 1000 : 0)
			}, 1000)
		} else if(checkResultInterval) {
			clearInterval(checkResultInterval)
		}
	}, [id])

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

							<span className="text-sm font-bold">{resultTimeoutValue / 1000} segundo(s)</span>
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