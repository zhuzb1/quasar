import Vue from 'vue'

import TouchPan from '../../directives/TouchPan.js'

import slot from '../../utils/slot.js'
import { stop } from '../../utils/event.js'

export default Vue.extend({
  name: 'QSplitter',

  directives: {
    TouchPan
  },

  props: {
    value: {
      type: Number,
      required: true
    },
    horizontal: Boolean,

    limits: {
      type: Array,
      default: () => [10, 90],
      validator: v => {
        if (v.length !== 2) return false
        if (typeof v[0] !== 'number' || typeof v[1] !== 'number') return false
        return v[0] >= 0 && v[0] <= v[1] && v[1] <= 100
      }
    },

    disable: Boolean,

    dark: Boolean,

    beforeClass: [Array, String, Object],
    afterClass: [Array, String, Object],

    separatorClass: [Array, String, Object],
    separatorStyle: [Array, String, Object]
  },

  watch: {
    value: {
      immediate: true,
      handler (v) {
        this.__normalize(v, this.limits)
      }
    },

    limits: {
      deep: true,
      handler (v) {
        this.__normalize(this.value, v)
      }
    }
  },

  computed: {
    classes () {
      return (this.horizontal ? 'column' : 'row') +
        ` q-splitter--${this.horizontal ? 'horizontal' : 'vertical'}` +
        ` q-splitter--${this.disable === true ? 'disabled' : 'workable'}` +
        (this.dark === true ? ' q-splitter--dark' : '')
    },

    prop () {
      return this.horizontal ? 'height' : 'width'
    },

    beforeStyle () {
      return { [this.prop]: this.value + '%' }
    },

    afterStyle () {
      return { [this.prop]: (100 - this.value) + '%' }
    }
  },

  methods: {
    __pan (evt) {
      if (evt.isFirst) {
        this.__size = this.$el.getBoundingClientRect()[this.prop]
        this.__value = this.value
        this.__dir = this.horizontal ? 'up' : 'left'
        this.__rtlDir = this.horizontal ? 1 : (this.$q.lang.rtl === true ? -1 : 1)

        this.$el.classList.add('q-splitter--active')
        return
      }

      if (evt.isFinal) {
        if (this.__normalized !== this.value) {
          this.$emit('input', this.__normalized)
        }

        this.$el.classList.remove('q-splitter--active')
        return
      }

      const val = this.__value +
        this.__rtlDir *
        (evt.direction === this.__dir ? -100 : 100) *
        evt.distance[this.horizontal ? 'y' : 'x'] / this.__size

      this.__normalized = Math.min(this.limits[1], Math.max(this.limits[0], val))
      this.$refs.before.style[this.prop] = this.__normalized + '%'
      this.$refs.after.style[this.prop] = (100 - this.__normalized) + '%'
    },

    __normalize (val, limits) {
      if (val < limits[0]) {
        this.$emit('input', limits[0])
      }
      else if (val > limits[1]) {
        this.$emit('input', limits[1])
      }
    }
  },

  render (h) {
    return h('div', {
      staticClass: 'q-splitter no-wrap',
      class: this.classes,
      on: this.$listeners
    }, [
      h('div', {
        ref: 'before',
        staticClass: 'q-splitter__panel q-splitter__before',
        style: this.beforeStyle,
        class: this.beforeClass,
        on: { input: stop }
      }, slot(this, 'before')),

      h('div', {
        staticClass: 'q-splitter__separator',
        style: this.separatorStyle,
        class: this.separatorClass
      }, this.disable === false ? [
        h('div', {
          staticClass: 'absolute-full',
          directives: [{
            name: 'touch-pan',
            value: this.__pan,
            modifiers: {
              horizontal: !this.horizontal,
              vertical: this.horizontal,
              prevent: true,
              mouse: true,
              mouseAllDir: true,
              mousePrevent: true
            }
          }]
        })
      ] : null),

      h('div', {
        ref: 'after',
        staticClass: 'q-splitter__panel q-splitter__after',
        style: this.afterStyle,
        class: this.afterClass,
        on: { input: stop }
      }, slot(this, 'after'))
    ].concat(slot(this, 'default')))
  }
})
