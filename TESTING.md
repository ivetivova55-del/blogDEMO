# Testing Guide

## Manual Testing Checklist

### Authentication Testing

- [ ] **Registration**
  - [ ] Valid form submits successfully
  - [ ] Email validation works
  - [ ] Password requirements enforced (6+ chars)
  - [ ] Passwords match validation
  - [ ] Error messages display correctly
  - [ ] User can login after registration

- [ ] **Login**
  - [ ] Valid credentials work
  - [ ] Invalid email shows error
  - [ ] Wrong password shows error
  - [ ] User redirected to home after login
  - [ ] Token stored in localStorage
  - [ ] Header shows username after login

- [ ] **Logout**
  - [ ] User can click logout
  - [ ] Session ends properly
  - [ ] Token removed from localStorage
  - [ ] User returned to home page
  - [ ] Cannot access protected pages

### Article Management Testing

- [ ] **Create Article**
  - [ ] Form displays all fields
  - [ ] Title is required
  - [ ] Content is required
  - [ ] Category selection works
  - [ ] Image upload works
  - [ ] Image preview displays
  - [ ] Publish toggle works
  - [ ] Article saves successfully
  - [ ] Redirect to articles list

- [ ] **List Articles**
  - [ ] Articles display with cards
  - [ ] Pagination works correctly
  - [ ] Search functionality works
  - [ ] Category filter works
  - [ ] View count displays
  - [ ] Author info visible
  - [ ] Category tags show

- [ ] **View Article**
  - [ ] Article displays full content
  - [ ] Cover image displays
  - [ ] Author info shown
  - [ ] Comments display
  - [ ] View count incremented
  - [ ] Related articles visible (if implemented)

- [ ] **Edit Article** (if implemented)
  - [ ] Author can edit own articles
  - [ ] Admin can edit any article
  - [ ] Non-author cannot edit
  - [ ] Changes save correctly

- [ ] **Delete Article**
  - [ ] Author can delete
  - [ ] Admin can delete
  - [ ] Confirmation dialog appears
  - [ ] Article removed from list
  - [ ] Comments deleted too

### Comments Testing

- [ ] **Add Comment**
  - [ ] Login required
  - [ ] Text field accepts input
  - [ ] Submit button works
  - [ ] Comment appears on page
  - [ ] Author name displays
  - [ ] Timestamp shows

- [ ] **Delete Comment**
  - [ ] Author can delete own
  - [ ] Admin can delete any
  - [ ] Confirmation appears
  - [ ] Comment removed

### Search & Filter Testing

- [ ] **Search**
  - [ ] Type in search box
  - [ ] Results filter correctly
  - [ ] No results shows message
  - [ ] Search works across titles and content
  - [ ] Case-insensitive search

- [ ] **Category Filter**
  - [ ] Category dropdown works
  - [ ] Selecting filters correctly
  - [ ] Clear filter works
  - [ ] Multiple filter combinations work

- [ ] **Pagination**
  - [ ] Next button works
  - [ ] Previous button works
  - [ ] Page numbers clickable
  - [ ] Correct articles on each page

### Admin Testing

- [ ] **Admin Dashboard Access**
  - [ ] Regular user cannot access
  - [ ] Admin user can access
  - [ ] Redirects to home if not admin

- [ ] **User Management**
  - [ ] User list displays
  - [ ] User info shows (email, role, date)
  - [ ] Role toggle works
  - [ ] User becomes admin after toggle
  - [ ] User loses admin after toggle

- [ ] **Statistics**
  - [ ] User count displays
  - [ ] Article count displays
  - [ ] Numbers are accurate

### UI/UX Testing

- [ ] **Navigation**
  - [ ] Header links work
  - [ ] Footer links work
  - [ ] Active page highlighted
  - [ ] Back button works
  - [ ] No broken links

- [ ] **Forms**
  - [ ] All inputs accept data
  - [ ] Required fields validated
  - [ ] Error messages show
  - [ ] Success messages show
  - [ ] Submit buttons disable while loading

- [ ] **Responsiveness**
  - [ ] Mobile (320px) - text readable, buttons clickable
  - [ ] Tablet (768px) - layout adjusts
  - [ ] Desktop (1024px+) - proper spacing
  - [ ] No horizontal scroll on mobile

- [ ] **Accessibility**
  - [ ] Keyboard navigation works
  - [ ] Links have keyboard focus
  - [ ] Forms have labels
  - [ ] Images have alt text
  - [ ] Color contrast sufficient

### Image Upload Testing

- [ ] **Valid Image**
  - [ ] JPG uploads
  - [ ] PNG uploads
  - [ ] WebP uploads
  - [ ] Preview displays
  - [ ] Public URL works

- [ ] **Invalid Image**
  - [ ] Large file rejected (>5MB)
  - [ ] Wrong format rejected
  - [ ] Error message shows

### Performance Testing

- [ ] **Load Times**
  - [ ] Home page loads in <2s
  - [ ] Article list loads quickly
  - [ ] Images load lazily
  - [ ] No JavaScript errors

- [ ] **Data**
  - [ ] Pagination loads 10 articles
  - [ ] Search is fast
  - [ ] Filters responsive
  - [ ] No lag on interactions

### Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iPhone)
- [ ] Chrome Mobile (Android)

### Error Handling Testing

- [ ] **Network Errors**
  - [ ] No internet - error message
  - [ ] Supabase down - error message
  - [ ] 404 article - error message
  - [ ] 403 unauthorized - error message

- [ ] **Form Errors**
  - [ ] Invalid email - error shows
  - [ ] Short password - error shows
  - [ ] Missing required field - error shows
  - [ ] Duplicate email - error shows

## Test Credentials

```
Regular User:
Email: demo@example.com
Password: demo123456

Admin User:
Email: admin@example.com
Password: admin123456
```

## Testing Workflow

### Before Each Commit

1. Run through main features
2. Check mobile responsiveness
3. Verify error handling
4. Test on different browser
5. Check console for errors

### Test Scenarios

**Scenario 1: New User Journey**
1. Visit home page
2. Click register
3. Create account
4. Login
5. Create article
6. View articles
7. Leave comment
8. View profile
9. Logout

**Scenario 2: Article Discovery**
1. Go to articles page
2. Search for article
3. Filter by category
4. Navigate pages
5. Click article
6. Read full content
7. Leave comment

**Scenario 3: Admin Tasks**
1. Login as admin
2. Go to admin dashboard
3. View statistics
4. Check user list
5. Toggle user role
6. View recent articles

## Performance Benchmarks

| Task | Target | Acceptable |
|------|--------|-----------|
| Home page load | <1s | <2s |
| Article list load | <1s | <2s |
| Search response | <500ms | <1s |
| Image upload | <3s | <5s |
| Comment post | <500ms | <1s |

## Browser DevTools Testing

### Network Tab
- Check API calls
- Verify response codes (200, 201, 400, 401)
- Monitor image downloads
- Check request sizes

### Console Tab
- No red error messages
- No warning messages
- Logs are clean

### Application Tab
- localStorage has `supabase_auth_token`
- No sensitive data in storage
- Cookies appropriate

### Performance Tab
- Record performance
- Check for bottlenecks
- Verify lazy loading

## Mobile Testing

### Responsive Design
```
# Test breakpoints
Mobile: < 768px
Tablet: 768px - 1024px
Desktop: > 1024px
```

### Touch Testing
- Buttons are >44px tall
- Links are >44px wide
- Spacing comfortable for touch
- Form inputs easy to use

### Mobile Specific
- No horizontal scrolling
- Mobile menu works
- Images scale properly
- Text readable without zoom

## Automated Testing (Future)

```javascript
// Example Jest test
test('fetchArticles returns articles', async () => {
  const result = await fetchArticles(1);
  expect(result.articles).toBeDefined();
  expect(result.articles.length).toBeGreaterThan(0);
  expect(result.total).toBeGreaterThan(0);
});

test('validateEmail works', () => {
  expect(validateEmail('valid@email.com')).toBe(true);
  expect(validateEmail('invalid.email')).toBe(false);
  expect(validateEmail('')).toBe(false);
});
```

## Bug Report Template

```
## Bug Title
[Clear, descriptive title]

## Steps to Reproduce
1. Go to ...
2. Click ...
3. See ...

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Browser/Device
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop / Mobile

## Screenshots
[Attach if applicable]

## Console Errors
[Copy any error messages]
```

## Testing Best Practices

1. **Test regularly** - Don't wait until deployment
2. **Test on real devices** - Emulators miss issues
3. **Test edge cases** - Empty states, errors, slow networks
4. **Test with real data** - Not just mock data
5. **Ask users** - Get feedback from actual users
6. **Document findings** - Keep testing notes

---

**Thorough testing ensures a quality application!**
