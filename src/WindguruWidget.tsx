import { useMemo } from 'react'

interface Props {
  spotId: number
  modelId?: number
  heightPx?: number
}

/**
 * Windguru's own widget loader assumes it's the first <script> tag on the
 * whole page (it inserts the real widget script next to
 * `document.getElementsByTagName('script')[0]`), which breaks inside a React
 * app full of other scripts — it would land wherever our bundle's own
 * scripts happen to sit, not inside this card. Isolating it in its own
 * sandboxed iframe document sidesteps that entirely, and drops
 * `allow-same-origin` (not needed for a widget that just renders a table)
 * so the third-party script never shares an origin with the rest of the
 * site.
 */
export default function WindguruWidget({ spotId, modelId = 3, heightPx = 340 }: Props) {
  const srcDoc = useMemo(() => {
    const uid = `wg_fwdg_${spotId}_${modelId}_${Math.random().toString(36).slice(2, 10)}`
    const params = [
      `s=${spotId}`,
      `m=${modelId}`,
      `uid=${uid}`,
      'wj=kmh',
      'tj=c',
      'fhours=6',
      'vt=forecasts',
      'lng=fr',
      'p=WINDSPD,GUST,SMER',
    ].join('&')
    // The widget's own table can run taller or wider than the sidebar;
    // scroll the body instead of silently clipping it to a fixed iframe
    // height like before.
    return `<!doctype html><html><head><meta charset="utf-8" /><style>
html,body{margin:0;padding:0;background:transparent;font-family:system-ui,sans-serif;overflow:auto;}
</style></head><body>
<div id="${uid}"></div>
<script>
(function(){
  var s = document.createElement('script');
  s.src = 'https://www.windguru.cz/js/widget.php?${params}';
  document.getElementById('${uid}').appendChild(s);
})();
</script>
</body></html>`
  }, [spotId, modelId])

  return (
    <div className="windguru-widget-mount">
      <iframe
        title="Prévisions de vent Windguru — Flic en Flac"
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-popups"
        className="windguru-widget-frame"
        style={{ height: heightPx }}
        loading="lazy"
      />
    </div>
  )
}
