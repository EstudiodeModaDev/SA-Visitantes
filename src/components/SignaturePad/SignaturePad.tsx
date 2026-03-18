import * as React from "react";
import "./SignaturePad.css";

export type SignaturePadValue = {
  blob: Blob;
  dataUrl: string;       // preview / debug
  width: number;
  height: number;
};

export type SignaturePadProps = {
  title?: string;
  subtitle?: string;

  /** Si cambia, el canvas se limpia (útil para reset desde afuera) */
  resetKey?: string | number;

  /** Cuando el usuario guarda (o cuando tú llames `getValue`) */
  onChange?: (value: SignaturePadValue | null) => void;

  /** Para bloquear firma si está enviando algo */
  disabled?: boolean;

  /** Opcional: color y grosor */
  strokeWidth?: number;
  strokeColor?: string;
};

export default function SignaturePad({title = "Firma", subtitle = "Firme dentro del recuadro", resetKey, onChange, disabled = false, strokeWidth = 2.2, strokeColor = "#0f172a",}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const drawingRef = React.useRef(false);
  const lastRef = React.useRef<{ x: number; y: number } | null>(null);

  const [hasInk, setHasInk] = React.useState(false);

  const setupCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const cssW = Math.max(320, Math.floor(rect.width));
    const cssH = Math.max(180, Math.floor(rect.height));

    // HiDPI
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;

    // Fondo blanco para que el PNG/JPG no quede transparente si no quieres
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssW, cssH);

    // Si ya había firma, al redimensionar se pierde (normal). Lo marcamos vacío.
    drawingRef.current = false;
    lastRef.current = null;
    setHasInk(false);
    onChange?.(null);
  }, [onChange, strokeColor, strokeWidth]);

  React.useEffect(() => {
    setupCanvas();
    const ro = new ResizeObserver(() => setupCanvas());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [setupCanvas]);

  React.useEffect(() => {
    if (resetKey === undefined) return;
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const getPos = (ev: PointerEvent, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  };

  const drawLine = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastRef.current = getPos(e.nativeEvent, canvas);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (!drawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const p = getPos(e.nativeEvent, canvas);
    const last = lastRef.current;
    if (last) {
      drawLine(last, p);
      lastRef.current = p;
      if (!hasInk) setHasInk(true);
    }
  };

  const onPointerUp = async () => {
    if (disabled) return;
    drawingRef.current = false;
    lastRef.current = null;

    // Opcional: emite un value cada vez que levanta el lápiz
    if (hasInk) {
      const value = await getValue();
      onChange?.(value);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // rellena blanco otra vez
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    drawingRef.current = false;
    lastRef.current = null;
    setHasInk(false);
    onChange?.(null);
  };

  const getValue = (): Promise<SignaturePadValue | null> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !hasInk) return resolve(null);

      // PNG por defecto
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const dataUrl = canvas.toDataURL("image/png");
        resolve({
          blob,
          dataUrl,
          width: canvas.clientWidth,
          height: canvas.clientHeight,
        });
      }, "image/png");
    });
  };

  return (
    <section className={`sig-card ${disabled ? "is-disabled" : ""}`}>
      <header className="sig-head">
        <div className="sig-titleWrap">
          <h3 className="sig-title">{title}</h3>
          <p className="sig-subtitle">{subtitle}</p>
        </div>

        <div className="sig-actions">
          <button type="button" className="sig-btn" onClick={clear} disabled={disabled || !hasInk}>
            Limpiar
          </button>
        </div>
      </header>

      <div className="sig-padWrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="sig-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {!hasInk && <div className="sig-hint">Firma aquí</div>}
      </div>

      <footer className="sig-foot">
        <span className="sig-meta">{hasInk ? "Firma capturada" : "Aún no hay firma"}</span>

        {/* Si quieres botón de “Guardar” aquí, lo dejamos opcional */}
        {/* <button className="sig-btn sig-btnPrimary" type="button" onClick={async()=>onChange?.(await getValue())}>Guardar firma</button> */}
      </footer>
    </section>
  );
}
