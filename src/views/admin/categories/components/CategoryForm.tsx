import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Save } from 'lucide-react'
import { useForm, useWatch, type UseFormSetError } from 'react-hook-form'

import { CategoryIconGlyph } from '@/components/shared/CategoryIconGlyph'
import type { AdminCategory, CategoryCreateInput, CategoryInput } from '@/@types/admin'
import { Alert, Button, Card, Input, Select, Textarea, type SelectOption } from '@/components/ui'
import {
    CATEGORY_ICON_NAMES,
    CATEGORY_ICONS,
    isCategoryIconName,
} from '@/constants/category.constant'
import { NOTICE_DISMISS_MS } from '@/constants/ui.constant'
import { getErrorMessage, isApiError } from '@/services/errors'
import { toColorInputValue } from '@/utils/color'
import { slugify } from '@/utils/slugify'
import {
    CATEGORY_DESCRIPTION_MAX_LENGTH,
    CATEGORY_SLUG_MAX_LENGTH,
    categoryFormSchema,
    EMPTY_CATEGORY_FORM,
    type CategoryFormValues,
} from '@/views/admin/categories/schema/category.schema'
import { useCreateCategory, useUpdateCategory } from '@/views/admin/hooks/useAdminCategories'

const ICON_OPTIONS: SelectOption[] = [
    { value: '', label: 'Predeterminado (aire acondicionado)' },
    ...CATEGORY_ICON_NAMES.map((name) => ({ value: name, label: CATEGORY_ICONS[name].label })),
]

function toFormValues(category: AdminCategory): CategoryFormValues {
    return {
        name: category.name,
        slug: category.slug,
        tagline: category.tagline,
        description: category.description,
        colorHex: category.colorHex,
        icon: isCategoryIconName(category.icon) ? category.icon : '',
    }
}

function toInput(values: CategoryFormValues): CategoryCreateInput {
    const slug = values.slug.trim()
    return {
        name: values.name.trim(),
        ...(slug ? { slug } : {}),
        tagline: values.tagline.trim(),
        description: values.description.trim(),
        colorHex: values.colorHex.trim().toUpperCase(),
        icon: values.icon || null,
    }
}

/** The slug is the category's identity: only sent on create. */
function toUpdateInput(values: CategoryFormValues): CategoryInput {
    const { name, tagline, description, colorHex, icon } = toInput(values)
    return { name, tagline, description, colorHex, icon }
}

/** Pins API validation errors (and a taken slug) on their fields. */
function applyServerErrors(
    error: unknown,
    values: CategoryFormValues,
    setError: UseFormSetError<CategoryFormValues>,
): void {
    if (!isApiError(error)) return
    if (error.status === 409) {
        setError('slug', { type: 'server', message: error.message })
        return
    }
    for (const detail of error.details) {
        const message = detail.errors[0]
        if (message && detail.field in values) {
            setError(detail.field as keyof CategoryFormValues, { type: 'server', message })
        }
    }
}

/**
 * `create` renders a standalone card. `edit` renders only the fields: it lives inside the
 * expanded `CategoryRow`, which already shows the name, color, counts and delete button.
 */
export type CategoryFormProps =
    | {
          mode: 'edit'
          category: AdminCategory
      }
    | {
          mode: 'create'
          onCreated: (category: AdminCategory) => void
          onCancel: () => void
      }

export function CategoryForm(props: CategoryFormProps) {
    const category = props.mode === 'edit' ? props.category : undefined
    const createCategory = useCreateCategory()
    const updateCategory = useUpdateCategory()
    const mutation = props.mode === 'create' ? createCategory : updateCategory
    const [isSaved, setIsSaved] = useState(false)
    /** Once the slug is typed by hand, the name stops rewriting it. */
    const [isSlugCustom, setIsSlugCustom] = useState(false)

    const {
        control,
        register,
        handleSubmit,
        reset,
        setError,
        setValue,
        formState: { errors, isDirty },
    } = useForm<CategoryFormValues>({
        resolver: zodResolver(categoryFormSchema),
        defaultValues: category ? toFormValues(category) : EMPTY_CATEGORY_FORM,
    })
    const [colorHex, name, icon] = useWatch({ control, name: ['colorHex', 'name', 'icon'] })

    const submit = handleSubmit((values) => {
        setIsSaved(false)
        const onError = (error: unknown) => applyServerErrors(error, values, setError)

        if (props.mode === 'create') {
            createCategory.mutate(toInput(values), { onSuccess: props.onCreated, onError })
            return
        }
        updateCategory.mutate(
            { slug: props.category.slug, input: toUpdateInput(values) },
            {
                onSuccess: (updated) => {
                    reset(toFormValues(updated))
                    setIsSaved(true)
                },
                onError,
            },
        )
    })

    const nameField = register('name', {
        onChange: (event: { target: { value: string } }) => {
            if (props.mode === 'create' && !isSlugCustom) {
                setValue('slug', slugify(event.target.value).slice(0, CATEGORY_SLUG_MAX_LENGTH), {
                    shouldValidate: Boolean(errors.slug),
                })
            }
        },
    })
    const slugField = register('slug', {
        onChange: (event: { target: { value: string } }) => {
            setIsSlugCustom(event.target.value !== '')
        },
    })

    const title = category?.name ?? (name.trim() || 'Nueva categoría')

    const form = (
        <form onSubmit={submit} noValidate className="space-y-5">
            {props.mode === 'create' ? (
                <div className="flex items-center gap-3">
                    <span
                        aria-hidden="true"
                        className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"
                    >
                        <CategoryIconGlyph name={icon} className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h2 className="text-xl break-words text-ink">{title}</h2>
                        <p className="text-xs break-words text-ink-soft">
                            Se añade al final del menú y del catálogo.
                        </p>
                    </div>
                </div>
            ) : null}

            <div className="grid grid-cols-1 items-start gap-5 @lg:grid-cols-2">
                <Input label="Nombre" error={errors.name?.message} {...nameField} />
                {props.mode === 'create' ? (
                    <Input
                        label="Slug (URL)"
                        optional
                        hint="Se genera a partir del nombre. No se puede cambiar después."
                        placeholder="aires-inverter"
                        autoCapitalize="none"
                        spellCheck={false}
                        error={errors.slug?.message}
                        {...slugField}
                    />
                ) : (
                    <Input
                        label="Frase corta"
                        optional
                        error={errors.tagline?.message}
                        {...register('tagline')}
                    />
                )}
            </div>
            {props.mode === 'create' ? (
                <Input
                    label="Frase corta"
                    optional
                    error={errors.tagline?.message}
                    {...register('tagline')}
                />
            ) : null}
            <Textarea
                label="Descripción"
                optional
                rows={3}
                error={errors.description?.message}
                maxLength={CATEGORY_DESCRIPTION_MAX_LENGTH}
                {...register('description')}
            />
            <div className="grid grid-cols-1 items-start gap-5 @lg:grid-cols-2">
                <div className="flex items-start gap-3">
                    <label className="mt-6.5 flex shrink-0 flex-col">
                        <span className="sr-only">Elegir color de {title}</span>
                        <input
                            type="color"
                            value={toColorInputValue(colorHex)}
                            onChange={(event) =>
                                setValue('colorHex', event.target.value.toUpperCase(), {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                })
                            }
                            className="size-11 cursor-pointer rounded-xl border border-line bg-white p-1"
                        />
                    </label>
                    <div className="w-full max-w-48">
                        <Input
                            label="Color (hex)"
                            spellCheck={false}
                            error={errors.colorHex?.message}
                            {...register('colorHex')}
                        />
                    </div>
                </div>
                <div className="flex items-end gap-3">
                    <span
                        aria-hidden="true"
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"
                    >
                        <CategoryIconGlyph name={icon} className="size-5" />
                    </span>
                    <Select
                        label="Ícono"
                        hint="Se muestra en el inicio y en el menú de categorías."
                        options={ICON_OPTIONS}
                        error={errors.icon?.message}
                        className="flex-1"
                        {...register('icon')}
                    />
                </div>
            </div>

            {mutation.isError ? <Alert>{getErrorMessage(mutation.error)}</Alert> : null}
            {isSaved ? (
                <Alert
                    tone="success"
                    autoDismissMs={NOTICE_DISMISS_MS}
                    onDismiss={() => setIsSaved(false)}
                >
                    Categoría actualizada.
                </Alert>
            ) : null}

            <div className="flex flex-wrap items-center justify-end gap-3">
                {props.mode === 'create' ? (
                    <Button
                        variant="secondary"
                        onClick={props.onCancel}
                        disabled={createCategory.isPending}
                    >
                        Cancelar
                    </Button>
                ) : null}
                <Button
                    type="submit"
                    disabled={(props.mode === 'edit' && !isDirty) || mutation.isPending}
                    isLoading={mutation.isPending}
                    leadingIcon={
                        props.mode === 'create' ? (
                            <Plus aria-hidden="true" className="size-4" />
                        ) : (
                            <Save aria-hidden="true" className="size-4" />
                        )
                    }
                >
                    {props.mode === 'create' ? 'Crear categoría' : 'Guardar'}
                </Button>
            </div>
        </form>
    )

    return props.mode === 'create' ? (
        <Card className="@container">{form}</Card>
    ) : (
        <div className="@container">{form}</div>
    )
}
