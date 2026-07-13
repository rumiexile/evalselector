**Button** — the primary action control. Use `primary` for the main action, `secondary` (outline) for alternatives, `ghost` for low-emphasis, `gradient` for hero CTAs, `danger` for destructive actions.

```jsx
<Button variant="primary">Apply for accreditation</Button>
<Button variant="secondary" size="lg">View report</Button>
<Button variant="gradient" iconRight={<span>→</span>}>Get started</Button>
```

Sizes: `sm` / `md` / `lg`. Set `as="a"` with `href` for link buttons. `fullWidth` stretches to the container.
