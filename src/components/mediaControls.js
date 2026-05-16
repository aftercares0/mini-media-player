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
    return html`
      ${this.renderMuteButton(muted)}
      <div class="mmp-media-controls__volume__slider">
        ${this.usesWebAwesomeSlider ? this.renderNativeVolSlider(muted) : this.renderHaVolSlider(muted)}
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
        ?disabled=${muted}
        min=${this.minVol}
        max=${this.maxVol}
        .value=${String(this.player.vol * 100)}
        step=${this.config.volume_step || 1}
        style="--mmp-range-value: ${this.rangeValue}%"
      />
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
    const target = ev.target;
    const min = Number(target.min);
    const max = Number(target.max);
    const value = Number(target.value);
    const range = max - min || 100;
    const percent = Math.min(Math.max(((value - min) / range) * 100, 0), 100);
    target.style.setProperty('--mmp-range-value', `${percent}%`);
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
          min-width: 100px;
          min-inline-size: 100px;
        }
        .mmp-media-controls__volume__range {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          display: block;
          height: var(--mmp-unit);
          margin: 0;
          padding: 0;
          transform: translateY(calc(var(--mmp-unit) * 0.075));
          --mmp-range-fill-color: var(--mmp-accent-color);
          --mmp-range-track-color: var(--mmp-text-color);
          --mmp-range-thumb-size: calc(var(--mmp-unit) * 0.35);
          --mmp-range-track-height: 3px;
        }
        .mmp-media-controls__volume__range:disabled {
          cursor: default;
          opacity: 0.5;
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
