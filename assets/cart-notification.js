class CartNotification extends HTMLElement {
  
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.cartNotification = document.querySelector('cart-notification');
    this.minicart = document.getElementById('cart-icon-bubble');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);
    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    // this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
    //   closeButton.addEventListener('click', this.close.bind(this))
    // );

    this.minicart.addEventListener('click', this.getCartData.bind(this));
  }

  open() {
    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener('transitionend', () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });

    document.body.addEventListener('click', this.onBodyClick);

    // After render cart
    this.querySelectorAll('button.cart-mini-close').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );
  }

  close() {
    this.notification.classList.remove('active');

    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  renderContents(parsedState) { console.log(parsedState);
    if(parsedState.item_count > 0 || parsedState.quantity > 0) {
      this.getSectionsToRender().forEach((section => { console.log(section);
        document.getElementById(section.id).innerHTML =
          this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
      }));

      if (this.header) this.header.reveal();
      this.open();
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-mini-body',
        selector: '#cart-mini-ajaxBody'
      },
      {
        id: 'cart-icon-bubble'
      }
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  getCartData(e) {
    e.preventDefault();

    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];

    const data = new FormData();
    data.append('sections', this.cartNotification.getSectionsToRender().map((section) => section.id));
    config.body = data;

    fetch(`${routes.cart_update_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        this.error = false;
        this.cartNotification.renderContents(response);
      })
      .catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('cart-notification', CartNotification);

class CartNotificationRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.preventDefault();
      this.closest('minicart-items').updateQuantityD(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartNotificationRemoveButton);

class CartNotificationItems extends HTMLElement {
  constructor() {
    super();
    this.cartNotification = document.querySelector('cart-notification');

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
        .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));
  }

  onChange(event) {
    this.updateQuantityD(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
  }

  updateQuantityD(line, quantity, name) {
    // this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.cartNotification.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => response.json())
      .then((response) => { console.log(response);
        if (response.item_count > 0) {
          this.cartNotification.renderContents(response);
        } else {
          document.getElementById('cart-icon-bubble').innerHTML =
              this.cartNotification.getSectionInnerHTML(response.sections['cart-icon-bubble']);

          this.cartNotification.close();
        }
      }).catch((e) => {
        console.error(e);
      });
  }
}

customElements.define('minicart-items', CartNotificationItems);