import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map';

import { ICON, REPEAT_STATE } from '../const';
import sharedStyle from '../sharedStyle';

class MiniMediaPlayerMediaControls extends LitElement {
  static get properties() {
    return {
      player: {},
      config: {},
      break: Boolean,
    };
  }

  get showShuffle() {
    return !this.config.hide.shuffle && this.player.supportsShuffle;
  }

  get showRepeat() {
    return !this.config.hide.repeat && this.player.supportsRepeat;
  }

  get maxVol() {
    return this.config.max_volume || 100;
  }

  get minVol() {
    return this.config.min_volume || 0;
  }

  get vol() {
    return Math.round(this.player.vol * 100);
  }

  get jumpAmount() {
    return this.config.jump_amount || 10;
  }

  render() {
    const { hide } = this.config;
    return html`
      ${!hide.volume ? this.renderVolControls(this.player.muted) : html``}
      ${this.renderShuffleButton()}
      ${this.renderRepeatButton()}
      ${!hide.controls ? html`
        <div class='flex mmp-media-controls__media' ?flow=${this.config.flow || this.break}>
          ${!hide.prev && this.player.supportsPrev ? html`
            <ha-icon-button
              @click=${e => this.player.prev(e)}
              .icon=${ICON.PREV}>
             <ha-icon .icon=${ICON.PREV}></ha-icon>
            </ha-icon-button>` : ''}
          ${this.renderJumpBackwardButton()}
          ${this.renderPlayButtons()}
          ${this.renderJumpForwardButton()}
          ${!hide.next && this.player.supportsNext ? html`
            <ha-icon-button
              @click=${e => this.player.next(e)}
              .icon=${ICON.NEXT}>
             <ha-icon .icon=${ICON.NEXT}></ha-icon>
            </ha-icon-button>` : ''}
        </div>
      ` : html``}
    `;
  }

  renderShuffleButton() {
    return this.showShuffle ? html`
      <div class='flex mmp-media-controls__shuffle'>
        <ha-icon-button
          class='shuffle-button'
          @click=${e => this.player.toggleShuffle(e)}
          .icon=${ICON.SHUFFLE}
          ?color=${this.player.shuffle}>
          <ha-icon .icon=${ICON.SHUFFLE}></ha-icon>
        </ha-icon-button>
      </div>
    ` : html``;
  }

  renderRepeatButton() {
    if (!this.showRepeat) return html``;

    const colored = [REPEAT_STATE.ONE, REPEAT_STATE.ALL].includes(this.player.repeat);
    return html`
      <div class='flex mmp-media-controls__repeat'>
        <ha-icon-button
          class='repeat-button'
          @click=${e => this.player.toggleRepeat(e)}
          .icon=${ICON.REPEAT[this.player.repeat]}
          ?color=${colored}>
          <ha-icon .icon=${ICON.REPEAT[this.player.repeat]}></ha-icon>
        </ha-icon-button>
      </div>
    `;
  }

  renderVolControls(muted) {
    const volumeControls = this.config.volume_stateless
      ? this.renderVolButtons(muted)
      : this.renderVolSlider(muted);

    const classes = classMap({
      '--buttons': this.config.volume_stateless,
      'mmp-media-controls__volume': true,
      flex: true,
    });

    const showVolumeLevel = !this.config.hide.volume_level;
    return html`
      <div class=${classes}>
        ${volumeControls}
        ${showVolumeLevel ? this.renderVolLevel() : ''}
      </div>`;
  }

  renderVolSlider(muted) {
    const rangeValue = this.rangeValue;
    const rangeFraction = rangeValue / 100;
    const thumbOffset = 7 - (14 * rangeFraction);
    const useNativeSlider = this.usesWebAwesomeSlider;

    return html`
      ${this.renderMuteButton(muted)}
      <div
        class="mmp-media-controls__volume__slider"
        style="--mmp-range-value: ${rangeValue}%; --mmp-range-thumb-offset: ${thumbOffset}px;"
      >
        ${useNativeSlider
          ? html`${this.renderNativeVolSlider(muted)}${this.renderVolumeBubble()}`
          : this.renderHaVolSlider(muted)}
      </div>
    `;
  }

  renderHaVolSlider(muted) {
    return html`
      <ha-slider
        @change=${this.handleVolumeChange}
        @click=${e => e.stopPropagation()}
        ?disabled=${muted}
        min=${this.minVol} max=${this.maxVol}
        .value=${this.player.vol * 100}
        step=${this.config.volume_step || 1}
        dir=${'ltr'}
        ignore-bar-touch pin labeled>
      </ha-slider>
    `;
  }

  renderNativeVolSlider(muted) {
    return html`
      <input
        class="mmp-media-controls__volume__range"
        type="range"
        @input=${this.handleVolumeInput}
        @change=${this.handleVolumeChange}
        @click=${e => e.stopPropagation()}
        @pointerup=${this.handleVolumePointerEnd}
        ?disabled=${muted}
        min=${this.minVol}
        max=${this.maxVol}
        .value=${String(this.player.vol * 100)}
        step=${this.config.volume_step || 1}
      />
    `;
  }

  renderVolumeBubble() {
    return html`
      <span class="mmp-media-controls__volume__bubble" aria-hidden="true">
        <span class="mmp-media-controls__volume__bubble__content">${this.vol}</span>
      </span>
    `;
  }

  get rangeValue() {
    const min = this.minVol;
    const max = this.maxVol;
    const value = Math.min(Math.max(this.player.vol * 100, min), max);
    return ((value - min) / (max - min || 100)) * 100;
  }

  get usesWebAwesomeSlider() {
    const SliderElement = customElements.get('ha-slider');
    const sliderPrototype = SliderElement && SliderElement.prototype;
    return !!sliderPrototype && ('withTooltip' in sliderPrototype || 'showTooltip' in sliderPrototype);
  }

  updated() {
    this.updateNativeVolumeSlider();
  }

  renderVolButtons(muted) {
    return html`
      ${this.renderMuteButton(muted)}
      <ha-icon-button
        @click=${e => this.player.volumeDown(e)}
        .icon=${ICON.VOL_DOWN}>
          <ha-icon .icon=${ICON.VOL_DOWN}></ha-icon>
      </ha-icon-button>
      <ha-icon-button
        @click=${e => this.player.volumeUp(e)}
        .icon=${ICON.VOL_UP}>
          <ha-icon .icon=${ICON.VOL_UP}></ha-icon>
      </ha-icon-button>
    `;
  }

  renderVolLevel() {
    return html`
      <span class="mmp-media-controls__volume__level">${this.vol}</span>
    `;
  }

  renderMuteButton(muted) {
    if (this.config.hide.mute) return;
    switch (this.config.replace_mute) {
      case 'play':
      case 'play_pause':
        return html`
          <ha-icon-button
            @click=${e => this.player.playPause(e)}
            .icon=${ICON.PLAY[this.player.isPlaying]}>
            <ha-icon .icon=${ICON.PLAY[this.player.isPlaying]}></ha-icon>
          </ha-icon-button>
        `;
      case 'stop':
        return html`
          <ha-icon-button
            @click=${e => this.player.stop(e)}
            .icon=${ICON.STOP.true}>
            <ha-icon .icon=${ICON.STOP.true}></ha-icon>
          </ha-icon-button>
        `;
      case 'play_stop':
        return html`
          <ha-icon-button
            @click=${e => this.player.playStop(e)}
            .icon=${ICON.STOP[this.player.isPlaying]}>
            <ha-icon .icon=${ICON.STOP[this.player.isPlaying]}></ha-icon>
          </ha-icon-button>
        `;
      case 'next':
        return html`
          <ha-icon-button
            @click=${e => this.player.next(e)}
            .icon=${ICON.NEXT}>
            <ha-icon .icon=${ICON.NEXT}></ha-icon>
          </ha-icon-button>
        `;
      default:
        if (!this.player.supportsMute) return;
        return html`
          <ha-icon-button
            @click=${e => this.player.toggleMute(e)}
            .icon=${ICON.MUTE[muted]}>
            <ha-icon .icon=${ICON.MUTE[muted]}></ha-icon>
          </ha-icon-button>
        `;
    }
  }

  renderPlayButtons() {
    const { hide } = this.config;
    return html`
      ${!hide.play_pause ? this.player.assumedState ? html`
        <ha-icon-button
          @click=${e => this.player.play(e)}
          .icon=${ICON.PLAY.false}>
            <ha-icon .icon=${ICON.PLAY.false}></ha-icon>
        </ha-icon-button>
        <ha-icon-button
          @click=${e => this.player.pause(e)}
          .icon=${ICON.PLAY.true}>
            <ha-icon .icon=${ICON.PLAY.true}></ha-icon>
        </ha-icon-button>
      ` : html`
        <ha-icon-button
          @click=${e => this.player.playPause(e)}
          .icon=${ICON.PLAY[this.player.isPlaying]}>
            <ha-icon .icon=${ICON.PLAY[this.player.isPlaying]}></ha-icon>
        </ha-icon-button>
      ` : html``}
      ${!hide.play_stop ? html`
        <ha-icon-button
          @click=${e => this.handleStop(e)}
          .icon=${hide.play_pause ? ICON.STOP[this.player.isPlaying] : ICON.STOP.true}>
            <ha-icon .icon=${hide.play_pause ? ICON.STOP[this.player.isPlaying] : ICON.STOP.true}></ha-icon>
        </ha-icon-button>
      ` : html``}
    `;
  }

  renderJumpForwardButton() {
    const hidden = this.config.hide.jump;
    if (hidden || !this.player.hasProgress) return html``;
    return html`
      <ha-icon-button
        @click=${e => this.player.jump(e, this.jumpAmount)}
        .icon=${ICON.FAST_FORWARD}>
        <ha-icon .icon=${ICON.FAST_FORWARD}></ha-icon>
      </ha-icon-button>
    `;
  }

  renderJumpBackwardButton() {
    const hidden = this.config.hide.jump;
    if (hidden || !this.player.hasProgress) return html``;
    return html`
      <ha-icon-button
        @click=${e => this.player.jump(e, -this.jumpAmount)}
        .icon=${ICON.REWIND}>
        <ha-icon .icon=${ICON.REWIND}></ha-icon>
      </ha-icon-button>
    `;
  }

  handleStop(e) {
    return this.config.hide.play_pause ? this.player.playStop(e) : this.player.stop(e);
  }

  handleVolumeChange(ev) {
    ev.stopPropagation();
    const vol = parseFloat(ev.target.value) / 100;
    this.player.setVolume(ev, vol);
  }

  handleVolumeInput(ev) {
    ev.stopPropagation();
    this.updateNativeVolumeSlider(ev.target);
  }

  handleVolumePointerEnd(ev) {
    requestAnimationFrame(() => ev.currentTarget.blur());
  }

  updateNativeVolumeSlider(target = this.shadowRoot.querySelector('.mmp-media-controls__volume__range')) {
    if (!target) return;

    const min = Number(target.min);
    const max = Number(target.max);
    const value = Number(target.value);
    const range = max - min || 100;
    const percent = Math.min(Math.max(((value - min) / range) * 100, 0), 100);
    const rangeHeight = parseFloat(getComputedStyle(target).height) || 24;
    const thumbSize = rangeHeight * (0.35 / 0.6);
    const thumbOffset = (thumbSize / 2) - (thumbSize * (percent / 100));
    const wrapper = target.parentElement;
    const bubbleContent = wrapper?.querySelector('.mmp-media-controls__volume__bubble__content');

    target.parentElement?.style.setProperty('--mmp-range-value', `${percent}%`);
    target.parentElement?.style.setProperty('--mmp-range-thumb-offset', `${thumbOffset}px`);
    target.style.setProperty('--mmp-range-value', `${percent}%`);
    if (bubbleContent) bubbleContent.textContent = `${Math.round(value)}`;
  }

  static get styles() {
    return [
      sharedStyle,
      css`
        :host {
          display: flex;
          width: 100%;
          align-items: center;
          column-gap: calc(var(--mmp-unit) * 0.1);
          justify-content: space-between;
        }
        .flex {
          display: flex;
          flex: 1;
          justify-content: space-between;
        }
        ha-slider,
        .mmp-media-controls__volume__range {
          align-self: center;
          box-sizing: border-box;
          flex: 1 1 auto;
          max-width: none;
          min-width: 0;
          min-inline-size: 0;
          width: 100%;
        }
        ha-slider {
          display: block;
          --md-sys-color-primary: var(--mmp-accent-color);
          --md-slider-active-track-color: var(--mmp-accent-color);
          --md-slider-handle-color: var(--mmp-accent-color);
          --ha-slider-thumb-color: var(--mmp-accent-color);
          --ha-slider-indicator-color: var(--mmp-accent-color);
          color: var(--mmp-text-color);
        }
        .mmp-media-controls__volume__slider {
          align-items: center;
          display: flex;
          flex: 1 1 100px;
          height: var(--mmp-range-state-layer-size, calc(var(--mmp-unit) * 0.6));
          min-width: 100px;
          min-inline-size: 100px;
          overflow: visible;
          position: relative;
          --mmp-range-state-layer-size: calc(var(--mmp-unit) * 0.6);
          --mmp-range-label-height: 28px;
          --mmp-range-label-gap: 5px;
        }
        .mmp-media-controls__volume__range {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          display: block;
          height: var(--mmp-range-state-layer-size);
          margin: 0;
          padding: 0;
          touch-action: none;
          --mmp-range-fill-color: var(--mmp-accent-color);
          --mmp-range-track-color: var(--mmp-text-color);
          --mmp-range-thumb-size: calc(var(--mmp-unit) * 0.35);
          --mmp-range-track-height: 4px;
        }
        .mmp-media-controls__volume__range:focus {
          outline: none;
        }
        .mmp-media-controls__volume__range:disabled {
          cursor: default;
          opacity: 0.5;
        }
        .mmp-media-controls__volume__range:disabled + .mmp-media-controls__volume__bubble {
          display: none;
        }
        .mmp-media-controls__volume__range::-webkit-slider-runnable-track {
          background: linear-gradient(
            to right,
            var(--mmp-range-fill-color) 0%,
            var(--mmp-range-fill-color) var(--mmp-range-value),
            var(--mmp-range-track-color) var(--mmp-range-value),
            var(--mmp-range-track-color) 100%
          );
          border: none;
          border-radius: var(--mmp-range-track-height);
          height: var(--mmp-range-track-height);
        }
        .mmp-media-controls__volume__range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          background: var(--mmp-range-fill-color);
          border: none;
          border-radius: 50%;
          height: var(--mmp-range-thumb-size);
          margin-top: calc((var(--mmp-range-track-height) - var(--mmp-range-thumb-size)) / 2);
          width: var(--mmp-range-thumb-size);
        }
        .mmp-media-controls__volume__range::-moz-range-track {
          background: var(--mmp-range-track-color);
          border: none;
          border-radius: var(--mmp-range-track-height);
          height: var(--mmp-range-track-height);
        }
        .mmp-media-controls__volume__range::-moz-range-progress {
          background: var(--mmp-range-fill-color);
          border: none;
          border-radius: var(--mmp-range-track-height);
          height: var(--mmp-range-track-height);
        }
        .mmp-media-controls__volume__range::-moz-range-thumb {
          background: var(--mmp-range-fill-color);
          border: none;
          border-radius: 50%;
          height: var(--mmp-range-thumb-size);
          width: var(--mmp-range-thumb-size);
        }
        .mmp-media-controls__volume__bubble {
          align-items: center;
          background: var(
            --md-slider-label-container-color,
            var(--mmp-accent-color, var(--md-sys-color-primary, var(--primary-color)))
          );
          border-radius: var(--md-sys-shape-corner-full, 9999px);
          bottom: calc(50% + var(--mmp-range-state-layer-size) / 2 + var(--mmp-range-label-gap));
          box-sizing: border-box;
          color: var(
            --md-slider-label-text-color,
            var(--md-sys-color-on-primary, var(--text-primary-color, #fff))
          );
          display: flex;
          font-family: var(
            --md-slider-label-text-font,
            var(--md-sys-typescale-label-medium-font, var(--md-ref-typeface-plain, Roboto))
          );
          font-size: var(
            --md-slider-label-text-size,
            var(--md-sys-typescale-label-medium-size, 0.75rem)
          );
          font-weight: var(
            --md-slider-label-text-weight,
            var(--md-sys-typescale-label-medium-weight, var(--md-ref-typeface-weight-medium, 500))
          );
          justify-content: center;
          left: var(--mmp-range-value);
          line-height: var(
            --md-slider-label-text-line-height,
            var(--md-sys-typescale-label-medium-line-height, 1rem)
          );
          margin-left: var(--mmp-range-thumb-offset, 0px);
          min-height: var(--mmp-range-label-height);
          min-width: var(--mmp-range-label-height);
          padding: 4px;
          pointer-events: none;
          position: absolute;
          transform: translateX(-50%) scale(0);
          transform-origin: center bottom;
          transition: transform 100ms cubic-bezier(0.2, 0, 0, 1);
          z-index: 3;
        }
        .mmp-media-controls__volume__bubble::before,
        .mmp-media-controls__volume__bubble::after {
          background: inherit;
          content: "";
          display: block;
          position: absolute;
        }
        .mmp-media-controls__volume__bubble::before {
          bottom: calc(var(--mmp-range-label-height) / -10);
          height: calc(var(--mmp-range-label-height) / 2);
          transform: rotate(45deg);
          width: calc(var(--mmp-range-label-height) / 2);
        }
        .mmp-media-controls__volume__bubble::after {
          border-radius: inherit;
          inset: 0;
        }
        .mmp-media-controls__volume__bubble__content {
          position: relative;
          z-index: 1;
        }
        .mmp-media-controls__volume__slider:hover .mmp-media-controls__volume__bubble,
        .mmp-media-controls__volume__range:focus-visible + .mmp-media-controls__volume__bubble,
        .mmp-media-controls__volume__range:active + .mmp-media-controls__volume__bubble {
          transform: translateX(-50%) scale(1);
        }
        ha-icon-button {
          min-width: var(--mmp-unit);
        }
        .mmp-media-controls__volume {
          flex: 1 1 auto;
          max-height: var(--mmp-unit);
          min-width: 0;
          align-items: center;
          column-gap: calc(var(--mmp-unit) * 0.15);
          justify-content: flex-start;
        }
        .mmp-media-controls__volume__level {
          align-items: center;
          display: flex;
          flex: 0 0 var(--mmp-unit);
          height: var(--mmp-unit);
          justify-content: flex-end;
          line-height: normal;
          white-space: nowrap;
        }
        .mmp-media-controls__volume.--buttons {
          justify-content: left;
        }
        .mmp-media-controls__media {
          flex: 0 0 auto;
          margin-right: 0;
          margin-left: auto;
          min-width: 0;
          justify-content: inherit;
        }
        .mmp-media-controls__media[flow] {
          flex: 1 1 auto;
          max-width: none;
          justify-content: space-between;
        }
        .mmp-media-controls__shuffle,
        .mmp-media-controls__repeat {
          flex: 3;
          flex-shrink: 200;
          justify-content: center;
        }
      `,
    ];
  }
}

customElements.define('mmp-media-controls', MiniMediaPlayerMediaControls);
