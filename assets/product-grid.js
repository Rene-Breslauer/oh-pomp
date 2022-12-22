class ProductGrid extends HTMLElement {
    constructor() {
        super()
        this.ul = this.querySelector('ul')
        this.loader = this.querySelector('.loader-wrapper')
        this.next_url = this.ul.dataset.nextUrl
        this.scrollLoad = true
        document.addEventListener('scroll', this.onScroll.bind(this))
    }

    onScroll() {
        let products_container_offset = this.ul.offsetTop
        let products_container_height = this.ul.offsetHeight
        
        if (this.scrollLoad && window.scrollY >= products_container_offset + products_container_height - window.innerHeight) {
            this.scrollLoad = false
            this.loadProducts()
        } 
    }

    loadProducts() {
        if (this.next_url) {
            this.loader.classList.remove('hidden')
            fetch(this.next_url).then(function (response) {
                return response.text();
            }).then(function (html) {
                let parser = new DOMParser()
                let doc = parser.parseFromString(html, 'text/html')
                let products = doc.getElementById('product-grid')
                let new_next_url = products.dataset.nextUrl
                this.next_url = new_next_url
                this.ul.insertAdjacentHTML('beforeend', products.innerHTML)
                let wishlist_buttons = this.ul.querySelectorAll('.wishlist-hero-custom-button')
                this.initWishlist(wishlist_buttons)
                this.scrollLoad = true
                this.loader.classList.add('hidden')
            }.bind(this)).catch(function (err) {
                console.warn('Something went wrong.', err)
            })
        }
    }

    initWishlist(wishlist_buttons) {
        wishlist_buttons.forEach((wishlist_button) => {
            let ev = new CustomEvent('wishlist-hero-add-to-custom-element', {
                detail: wishlist_button,
            })

            document.dispatchEvent(ev)
        })
    }
}
  
customElements.define('product-grid', ProductGrid);