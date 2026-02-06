export function createFooter() {
  return `
    <footer class="footer">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-4 footer-section">
            <h5>About BlogDemo</h5>
            <p>A modern platform for sharing IT and marketing insights with our global community.</p>
          </div>
          <div class="col-md-4 footer-section">
            <h5>Quick Links</h5>
            <ul>
              <li><a href="#/">Home</a></li>
              <li><a href="#/articles">Articles</a></li>
              <li><a href="#/about">About Us</a></li>
              <li><a href="#/contact">Contact</a></li>
            </ul>
          </div>
          <div class="col-md-4 footer-section">
            <h5>Follow Us</h5>
            <ul>
              <li><a href="#" target="_blank">Twitter</a></li>
              <li><a href="#" target="_blank">LinkedIn</a></li>
              <li><a href="#" target="_blank">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 BlogDemo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `;
}
