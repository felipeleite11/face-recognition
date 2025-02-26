'use client'

import { ChangeEvent, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import toast from 'react-hot-toast'
import classNames from 'classnames'
import { api } from '@/config/api'

interface FormProps {
	identifier: string
}

export function ReferenceForm() {
	const [file, setFile] = useState<File | null>(null)
	const [URLPreview, setURLPreview] = useState<string | null>(null)

	async function handleSubmit(values: FormProps) {
		try {
			const { identifier } = values

			const formData = new FormData()

			formData.append('identifier', identifier)

			if (!file) {
				console.log('Imagem não anexada.')
				return
			}

			formData.append('file', file)

			const { data } = await api.post('reference', formData)

			if (data.message) {
				throw new Error(data.message)
			}

			toast('Referência cadastrada!')
		} catch (e) {
			console.log(e)
			toast((e as Error).message)
		}
	}

	return (
		<div className="w-[50%] flex justify-center">
			<Formik
				onSubmit={handleSubmit}
				initialValues={{
					identifier: ''
				}}
			>
				{({ isSubmitting }) => (
					<Form className="flex flex-col gap-4 w-[40rem] items-center">
						<h1 className="font-bold text-lg text-center">Foto de referência</h1>

						{URLPreview && (
							<img src={URLPreview} alt="" className="w-56 rounded-md" />
						)}

						<label
							htmlFor="file"
							className="py-2 px-4 bg-white rounded-md h-11 text-slate-800 flex items-center w-full"
						>
							<span className={classNames({
								'opacity-60': !file?.name,
								'opacity-100': !!file?.name
							})}>
								{file?.name || 'Selecione a imagem'}
							</span>
						</label>

						<input
							id="file"
							type="file"
							className="hidden"
							onChange={(e: ChangeEvent<HTMLInputElement>) => {
								const file = e.currentTarget.files?.[0] || null

								if (file) {
									const url = URL.createObjectURL(file)

									setURLPreview(url)
									setFile(file)
								}
							}}
						/>

						<Field name="identifier" className="py-2 px-4 rounded-md h-11 text-slate-800 outline-none w-full" placeholder="Identificador da pessoa" />

						<button
							type="submit"
							className="py-2 px-4 bg-white text-slate-800 rounded-md disabled:opacity-80 w-full"
							disabled={isSubmitting}
						>
							Cadastrar referência
						</button>
					</Form>
				)}
			</Formik>
		</div>
	)
}