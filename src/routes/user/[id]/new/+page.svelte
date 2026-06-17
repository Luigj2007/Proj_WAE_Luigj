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

	// Check whether the uploaded file can be sent without canvas processing.
	function isDefaultFilters() {
		return brightness === 1 && contrast === 1 && saturate === 1 && blur === 0 && hue === 0;
	}

	// Build the CSS filter string used by the preview and canvas export.
	function filterStyle() {
		return `brightness(${brightness}) contrast(${contrast}) saturate(${saturate}) blur(${blur}px) hue-rotate(${hue}deg)`;
	}

	// Clear the native file input after the selected file is removed.
	function clearFileInput() {
		if (fileInput) {
			fileInput.value = '';
		}
	}

	// Replace the form file with the edited image so the server receives it.
	function syncFileInput(file) {
		if (!fileInput) {
			return;
		}

		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		fileInput.files = dataTransfer.files;
	}

	// Pick a file extension that matches the generated image MIME type.
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

	// Keep common image types, and fall back to PNG for unsupported uploads.
	function outputTypeFor(file) {
		if (file.type === 'image/jpeg' || file.type === 'image/webp' || file.type === 'image/png') {
			return file.type;
		}

		return 'image/png';
	}

	// Remove the original extension before adding the edited suffix.
	function baseName(name) {
		return name.replace(/\.[^.]+$/, '');
	}

	// Load an object URL into an Image element for canvas rendering.
	function loadImage(src) {
		return new Promise((resolveImage, rejectImage) => {
			const image = new Image();
			image.onload = () => resolveImage(image);
			image.onerror = () => rejectImage(new Error('Failed to load image'));
			image.src = src;
		});
	}

	// Render the edited preview into a File object for upload.
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
		} catch {
			previewError = 'Could not process the preview image.';
			syncFileInput(selectedFile);
		} finally {
			if (currentToken === processingToken) {
				isProcessing = false;
			}
		}
	}

	// Load the selected file and create a browser preview URL.
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

	// Re-render the upload file whenever a filter slider changes.
	function handleFilterChange() {
		if (selectedFile) {
			void renderFilteredFile();
		}
	}

	// Restore all filter sliders to their neutral values.
	function resetFilters() {
		brightness = 1;
		contrast = 1;
		saturate = 1;
		blur = 0;
		hue = 0;
		handleFilterChange();
	}

	// Release the object URL when the editor leaves the page.
	onDestroy(() => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}
	});
</script>

<svelte:head>
	<title>New image | Image Blog</title>
</svelte:head>

<main class="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10">
	<section class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="text-xs font-bold text-app-primary uppercase">Image editor</p>
			<h1 class="mt-2 text-3xl font-black text-app-ink sm:text-4xl">Create a new image</h1>
			<p class="mt-3 max-w-2xl text-base leading-7 text-app-muted">
				Preview your image, adjust live filters, and upload the edited result to your profile.
			</p>
		</div>

		<nav class="flex flex-wrap gap-3">
			<a
				href={resolve(`/user/${data.user.id}`)}
				class="rounded-md border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary"
			>
				Profile
			</a>
			<a
				href={resolve('/')}
				class="rounded-md border border-app-line bg-app-surface px-4 py-2 text-sm font-semibold text-app-ink transition hover:-translate-y-0.5 hover:border-app-primary hover:text-app-primary"
			>
				Home
			</a>
		</nav>
	</section>

	<div class="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
		<section class="rounded-lg border border-app-line bg-app-surface p-5 shadow-app-soft">
			<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-xl font-bold text-app-ink">Live preview</h2>
					<p class="text-sm text-app-muted">What you see here is what gets uploaded.</p>
				</div>
				{#if selectedFile}
					<span class="rounded-md bg-app-paper px-3 py-1 text-xs font-semibold text-app-muted">
						{selectedFile.name}
					</span>
				{/if}
			</div>

			<div
				class="flex min-h-[22rem] items-center justify-center rounded-lg border border-dashed border-app-line bg-app-paper p-4 sm:min-h-[28rem]"
			>
				{#if previewUrl}
					<img
						src={previewUrl}
						alt="Selected preview"
						class="max-h-[26rem] w-full rounded-md object-contain shadow-lg"
						style={`filter: ${filterStyle()};`}
					/>
				{:else}
					<div class="max-w-sm text-center text-app-muted">
						<p class="text-lg font-semibold text-app-ink">Choose an image to start editing</p>
						<p class="mt-2 text-sm">
							Tune brightness, contrast, saturation, blur, and hue before upload.
						</p>
					</div>
				{/if}
			</div>

			{#if previewError}
				<p class="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-app-danger">
					{previewError}
				</p>
			{/if}
		</section>

		<section class="rounded-lg border border-app-line bg-app-surface p-5 shadow-app-soft">
			<h2 class="text-xl font-bold text-app-ink">Edit image</h2>
			<p class="mb-6 text-sm text-app-muted">Use the sliders to shape the final upload.</p>

			<form method="POST" action="?/createArticle" enctype="multipart/form-data" class="space-y-6">
				<div>
					<label for="uploadedImage" class="mb-1 block text-sm font-semibold text-app-ink"
						>Image</label
					>
					<input
						id="uploadedImage"
						bind:this={fileInput}
						type="file"
						name="uploadedImage"
						accept="image/*"
						onchange={handleFileChange}
						class="w-full rounded-md border-app-line p-3 text-sm transition file:mr-4 file:rounded-md file:border-0 file:bg-app-primary file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-app-primary-dark focus:border-app-primary focus:ring-app-primary"
					/>
				</div>

				<div class="space-y-4 rounded-lg bg-app-paper p-4">
					<div>
						<div class="mb-2 flex items-center justify-between gap-3">
							<label for="brightness" class="text-sm font-semibold text-app-ink">Brightness</label>
							<span class="text-xs font-medium text-app-muted">{brightness.toFixed(2)}</span>
						</div>
						<input
							id="brightness"
							type="range"
							min="0.2"
							max="2"
							step="0.01"
							bind:value={brightness}
							oninput={handleFilterChange}
							class="w-full accent-app-primary"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between gap-3">
							<label for="contrast" class="text-sm font-semibold text-app-ink">Contrast</label>
							<span class="text-xs font-medium text-app-muted">{contrast.toFixed(2)}</span>
						</div>
						<input
							id="contrast"
							type="range"
							min="0.2"
							max="2"
							step="0.01"
							bind:value={contrast}
							oninput={handleFilterChange}
							class="w-full accent-app-primary"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between gap-3">
							<label for="saturate" class="text-sm font-semibold text-app-ink">Saturation</label>
							<span class="text-xs font-medium text-app-muted">{saturate.toFixed(2)}</span>
						</div>
						<input
							id="saturate"
							type="range"
							min="0"
							max="3"
							step="0.01"
							bind:value={saturate}
							oninput={handleFilterChange}
							class="w-full accent-app-primary"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between gap-3">
							<label for="blur" class="text-sm font-semibold text-app-ink">Blur</label>
							<span class="text-xs font-medium text-app-muted">{blur}px</span>
						</div>
						<input
							id="blur"
							type="range"
							min="0"
							max="12"
							step="0.1"
							bind:value={blur}
							oninput={handleFilterChange}
							class="w-full accent-app-primary"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between gap-3">
							<label for="hue" class="text-sm font-semibold text-app-ink">Hue rotate</label>
							<span class="text-xs font-medium text-app-muted">{hue} deg</span>
						</div>
						<input
							id="hue"
							type="range"
							min="0"
							max="360"
							step="1"
							bind:value={hue}
							oninput={handleFilterChange}
							class="w-full accent-app-primary"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<button
						type="button"
						onclick={resetFilters}
						class="rounded-md border border-app-line px-4 py-2 text-sm font-semibold text-app-ink transition hover:bg-app-paper"
					>
						Reset filters
					</button>

					<button
						type="submit"
						disabled={!selectedFile || isProcessing}
						class="rounded-md bg-app-primary px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-primary-dark disabled:cursor-not-allowed disabled:bg-app-muted sm:min-w-40"
					>
						{isProcessing ? 'Processing...' : 'Add image'}
					</button>
				</div>
			</form>
		</section>
	</div>
</main>
