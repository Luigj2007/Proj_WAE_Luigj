<script>
	import { resolve } from '$app/paths';
	import { onDestroy } from 'svelte';

	let { data } = $props();

	let fileInput;
	let selectedFile = $state(null);
	let previewUrl = $state('');
	let previewError = $state('');
	let brightness = $state(1);
	let contrast = $state(1);
	let saturate = $state(1);
	let blur = $state(0);
	let hue = $state(0);
	let isProcessing = $state(false);
	let processingToken = $state(0);

	function isDefaultFilters() {
		return brightness === 1 && contrast === 1 && saturate === 1 && blur === 0 && hue === 0;
	}

	function filterStyle() {
		return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px) hue-rotate(${hue}deg)`;
	}

	function clearFileInput() {
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function syncFileInput(file) {
		if (!fileInput) {
			return;
		}

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		fileInput.files = dataTransfer.files;
	}

	function extensionFromType(type) {
		switch (type) {
			case 'image/jpeg':
				return 'jpg';
			case 'image/webp':
				return 'webp';
			default:
				return 'png';
		}
	}

	function outputTypeFor(file) {
		if (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png') {
			return file.type;
		}

		return 'image/png';
	}

	function baseName(name) {
		return name.replace(/\.[^.]+$/, '');
	}

	function loadImage(src) {
		return new Promise((resolveImage, rejectImage) => {
			const image = new Image();
			image.onload = () => resolveImage(image);
			image.onerror = () => rejectImage(new Error('Failed to load image'));
			image.src = src;
		});
	}

	async function renderFilteredFile() {
		if (!selectedFile || !previewUrl) {
			return;
		}

		const currentToken = ++processingToken;
		isProcessing = true;
		previewError = '';

		try {
			if (isDefaultFilters()) {
				syncFileInput(selectedFile);
				return;
			}

			const image = await loadImage(previewUrl);
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;

			const context = canvas.getContext('2d');
			if (!context) {
				throw new Error('Canvas unavailable');
			}

			context.filter = filterStyle();
			context.drawImage(image, 0, 0);

			const outputType = outputTypeFor(selectedFile);
			const blob = await new Promise((resolveBlob, rejectBlob) => {
				canvas.toBlob(
					(value) => {
						if (value) {
							resolveBlob(value);
							return;
						}

						rejectBlob(new Error('Failed to process image'));
					},
					outputType,
					outputType === 'image/jpeg' ? 0.92 : undefined
				);
			});

			if (currentToken !== processingToken) {
				return;
			}

			const editedFile = new File(
				[blob],
				`${baseName(selectedFile.name)}-edited.${extensionFromType(outputType)}`,
				{ type: outputType }
			);

			syncFileInput(editedFile);
		} catch (error) {
			previewError = 'Could not process the preview image.';
			syncFileInput(selectedFile);
		} finally {
			if (currentToken === processingToken) {
				isProcessing = false;
			}
		}
	}

	function handleFileChange(event) {
		const file = event.currentTarget.files?.[0] ?? null;
		selectedFile = file;
		previewError = '';

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = '';
		}

		if (!file) {
			clearFileInput();
			processingToken += 1;
			isProcessing = false;
			return;
		}

		previewUrl = URL.createObjectURL(file);
		void renderFilteredFile();
	}

	function handleFilterChange() {
		if (selectedFile) {
			void renderFilteredFile();
		}
	}

	onDestroy(() => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
	});
</script>

<section class="mx-auto mb-8 max-w-6xl text-center">
	<h1 class="mb-3 text-4xl font-bold text-gray-800">🖼️ Create a New Image</h1>
	<p class="text-gray-500">Preview the image, adjust five live CSS filters, then upload the edited result.</p>
</section>

<div class="mb-6 flex justify-center gap-4">
	<a
		href={`/user/${data.user.id}`}
		class="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
		>← User Dashboard</a
	>
	<a
		href="/"
		class="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-200"
		>🏠 Home</a
	>
</div>

<div class="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.25fr_0.75fr]">
	<div class="overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 shadow-xl">
		<div class="mb-4 flex items-center justify-between gap-3">
			<div>
				<h2 class="text-xl font-bold text-gray-900">Live preview</h2>
				<p class="text-sm text-gray-500">What you see here is what gets uploaded.</p>
			</div>
			{#if selectedFile}
				<span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{selectedFile.name}</span>
			{/if}
		</div>

		<div class="flex min-h-[28rem] items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-4">
			{#if previewUrl}
				<img
					src={previewUrl}
					alt="Selected preview"
					class="max-h-[26rem] w-full rounded-2xl object-contain shadow-lg"
					style={`filter: ${filterStyle()};`}
				/>
			{:else}
				<div class="max-w-sm text-center text-gray-500">
					<p class="text-lg font-semibold text-gray-700">Choose an image to start editing</p>
					<p class="mt-2 text-sm">You can tune brightness, contrast, saturation, blur, and hue before the upload.</p>
				</div>
			{/if}
		</div>

		{#if previewError}
			<p class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{previewError}</p>
		{/if}
	</div>

	<div class="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
		<h2 class="mb-2 text-xl font-bold text-gray-900">Edit image</h2>
		<p class="mb-6 text-sm text-gray-500">Five filters update the preview in real time.</p>

		<form
			method="POST"
			action="?/createArticle"
			enctype="multipart/form-data"
			class="space-y-6"
		>
			<div>
				<label for="uploadedImage" class="mb-1 block text-sm font-semibold text-gray-700">Image</label>
				<input
					id="uploadedImage"
					bind:this={fileInput}
					type="file"
					name="uploadedImage"
					accept="image/*"
					onchange={handleFileChange}
					class="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</div>

			<div class="space-y-4 rounded-2xl bg-gray-50 p-4">
				<div>
					<div class="mb-2 flex items-center justify-between gap-3">
						<label for="brightness" class="text-sm font-semibold text-gray-700">Brightness</label>
						<span class="text-xs font-medium text-gray-500">{brightness.toFixed(2)}</span>
					</div>
					<input id="brightness" type="range" min="0.2" max="2" step="0.01" bind:value={brightness} oninput={handleFilterChange} class="w-full" />
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between gap-3">
						<label for="contrast" class="text-sm font-semibold text-gray-700">Contrast</label>
						<span class="text-xs font-medium text-gray-500">{contrast.toFixed(2)}</span>
					</div>
					<input id="contrast" type="range" min="0.2" max="2" step="0.01" bind:value={contrast} oninput={handleFilterChange} class="w-full" />
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between gap-3">
						<label for="saturate" class="text-sm font-semibold text-gray-700">Saturation</label>
						<span class="text-xs font-medium text-gray-500">{saturate.toFixed(2)}</span>
					</div>
					<input id="saturate" type="range" min="0" max="3" step="0.01" bind:value={saturate} oninput={handleFilterChange} class="w-full" />
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between gap-3">
						<label for="blur" class="text-sm font-semibold text-gray-700">Blur</label>
						<span class="text-xs font-medium text-gray-500">{blur}px</span>
					</div>
					<input id="blur" type="range" min="0" max="12" step="0.1" bind:value={blur} oninput={handleFilterChange} class="w-full" />
				</div>

				<div>
					<div class="mb-2 flex items-center justify-between gap-3">
						<label for="hue" class="text-sm font-semibold text-gray-700">Hue rotate</label>
						<span class="text-xs font-medium text-gray-500">{hue}°</span>
					</div>
					<input id="hue" type="range" min="0" max="360" step="1" bind:value={hue} oninput={handleFilterChange} class="w-full" />
				</div>
			</div>

			<div class="flex items-center justify-between gap-4">
				<button
					type="button"
					onclick={() => {
						brightness = 1;
						contrast = 1;
						saturate = 1;
						blur = 0;
						hue = 0;
						handleFilterChange();
					}}
					class="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
				>
					Reset filters
				</button>

				<button
					type="submit"
					disabled={!selectedFile || isProcessing}
					class="w-full rounded-full bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
				>
					{#if isProcessing}
						Processing preview...
					{:else}
						📤 Add Image
					{/if}
				</button>
			</div>
		</form>
	</div>
</div>
