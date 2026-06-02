<template>
    <div id="layout">
        <nav>
            <a
                class="logo-link"
                :href="orgUrl"
                target="_blank"
                rel="noopener noreferrer"
                title="Spectrum Integrators">
                <img id="logo" :src="logoUrl" alt="Spectrum Integrators" />
            </a>
            <h1 class="app-title">Shure DSP Command Finder</h1>

            <label class="model-picker">
                <span class="mp-label">Model</span>
                <select v-model="currentModelId">
                    <option v-for="m in models" :key="m.meta.id" :value="m.meta.id">
                        {{ m.meta.fullName || m.meta.name }}
                    </option>
                </select>
            </label>

            <span class="app-sub" :title="cmdRefTitle">{{ cmdRefLabel }} &middot; TCP {{ model.meta.port }}</span>
        </nav>
        <main>
            <HomeView :model="model" />
        </main>
        <footer>
            <a
                class="license-link"
                :href="licenseUrl"
                target="_blank"
                rel="noopener noreferrer"
                title="View the MIT License">Copyright &copy; 2026 Spectrum Integrators</a>. Reference tool only &mdash;
            not affiliated with, endorsed by, or sponsored by Shure Incorporated.
        </footer>
    </div>
</template>

<script>
import HomeView from '@/views/HomeView.vue';
import logoUrl from '@/assets/logo.svg';
import { ORG_URL, LICENSE_URL } from '@/config.js';
import { MODELS, getModel, DEFAULT_MODEL_ID } from '@/models/index.js';

const LS_MODEL = 'p300finder.model';

export default {
    name: 'App',
    components: { HomeView },
    data() {
        let saved = null;
        try {
            saved = localStorage.getItem(LS_MODEL);
        } catch {
            /* ignore */
        }
        return {
            logoUrl,
            orgUrl: ORG_URL,
            licenseUrl: LICENSE_URL,
            models: MODELS,
            currentModelId: getModel(saved).meta.id || DEFAULT_MODEL_ID,
        };
    },
    computed: {
        model() {
            return getModel(this.currentModelId);
        },
        // The command lists in this tool are transcribed from Shure's per-model
        // "command strings" reference PDFs. docDate is when that reference was published
        // (from the Shure date code), so it doubles as "command list last updated".
        cmdRefLabel() {
            const d = this.model.meta.docDate;
            return d ? `Command list updated ${d}` : 'Command list reference';
        },
        cmdRefTitle() {
            const m = this.model.meta;
            const parts = [`Commands transcribed from the ${m.fullName || m.name} command-strings reference.`];
            if (m.docVersion) parts.push(`Document/firmware version ${m.docVersion}.`);
            if (m.docDate) parts.push(`Published ${m.docDate}.`);
            return parts.join(' ');
        },
    },
    watch: {
        currentModelId(id) {
            try {
                localStorage.setItem(LS_MODEL, id);
            } catch {
                /* ignore */
            }
        },
    },
};
</script>

<style lang="scss">
@use '@/styles/colors' as c;

$navbar-height: 60px;
$footer-height: 22px;

#layout {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

nav {
    flex: 0 0 $navbar-height;
    background: c.$primary;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
    z-index: 1;

    .logo-link {
        display: block;
        height: calc(#{$navbar-height} - 16px);
    }

    #logo {
        height: 100%;
        padding: 8px 0;
        width: auto;
        display: block;
    }

    .app-title {
        color: c.$text-light;
        font-size: 1.15rem;
        font-weight: 500;
        margin: 0;
        white-space: nowrap;
    }

    .model-picker {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;

        .mp-label {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        select {
            font-family: 'Lato', sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            border: 1px solid rgba(255, 255, 255, 0.3);
            background: #fff;
            color: c.$text-dark;
            border-radius: 6px;
            padding: 4px 8px;
            cursor: pointer;
        }
    }

    .app-sub {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.78rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-left: auto;
    }
}

main {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px;
}

footer {
    flex: 0 0 $footer-height;
    background: c.$primary;
    color: c.$text-light;
    font-size: 0.72rem;
    line-height: $footer-height;
    text-align: center;
    opacity: 0.85;
    padding: 0 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .license-link {
        color: inherit;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
