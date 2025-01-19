'use client'

import { ChangeEvent, useState } from 'react'
import { Formik, Form, Field } from 'formik'
import toast from 'react-hot-toast'
import axios from 'axios'
import classNames from 'classnames'

interface FormProps {
	identifier: string
}

export function ReferenceForm() {
	const [file, setFile] = useState<File | null>(null)

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

			const { data } = await axios.post('http://localhost:3360/reference', formData)

			if(data.message) {
				throw new Error(data.message)
			}

			toast('Referência cadastrada!')
		} catch(e) {
			console.log(e)
			toast((e as Error).message)
		}
	}

	return (
		<Formik
			onSubmit={handleSubmit}
			initialValues={{
				identifier: ''
			}}
		>
			{({ isSubmitting }) => (
				<Form className="flex flex-col gap-4">
					<h1 className="font-bold text-lg text-center">Foto de referência</h1>

					<label
						htmlFor="file"
						className="py-2 px-4 bg-white rounded-md h-11 text-slate-800 flex items-center"
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

							setFile(file)
						}}
					/>

					<Field name="identifier" className="py-2 px-4 rounded-md h-11 text-slate-800 outline-none" placeholder="Identificador da pessoa" />

					<button
						type="submit"
						className="py-2 px-4 bg-white text-slate-800 rounded-md disabled:opacity-80"
						disabled={isSubmitting}
					>
						Cadastrar referência
					</button>		
				</Form>
			)}
		</Formik>
	)
}