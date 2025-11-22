# Decision Tree Component

Componente de visualización de árbol de decisiones usando React Flow.

## Componentes

### `DecisionTree`
Componente principal que renderiza el árbol de decisiones.

**Props:**
- `decision: string` - La decisión del usuario (nodo raíz)
- `consequences: Consequence[]` - Array de consecuencias a mostrar

**Características:**
- Layout vertical (de arriba hacia abajo)
- Nodo raíz azul con la decisión del usuario
- 10 nodos de consecuencias con colores basados en probabilidad:
  - 🟢 Verde (60%+): Alta probabilidad
  - 🟡 Amarillo (30-59%): Probabilidad media
  - 🔴 Rojo (<30%): Baja probabilidad
  - 🟣 Morado (≤10%): Alto impacto
- Panel lateral derecho con detalles al hacer click
- Controles de zoom y minimap
- Background con cuadrícula

### `ConsequenceNode`
Nodo personalizado para React Flow.

**Props:**
- `data.label: string` - Nombre de la consecuencia
- `data.probabilidad: number` - Probabilidad (0-100)
- `data.isRoot?: boolean` - Si es el nodo raíz

**Características:**
- Todos los nodos del mismo tamaño
- Solo muestra el nombre y porcentaje
- Efecto hover con scale
- Borde cuando está seleccionado

### `DetailPanel`
Panel lateral que muestra detalles de la consecuencia seleccionada.

**Props:**
- `consequence: Consequence | null` - Consecuencia a mostrar
- `onClose: () => void` - Callback para cerrar el panel

**Muestra:**
- Nombre de la consecuencia
- Badge "Alto impacto" si probabilidad ≤ 10%
- Probabilidad en grande y con color
- Descripción completa
- Lista numerada de impactos

## Uso

```typescript
import { DecisionTree } from "@/components";

function Dashboard() {
  const [consequences, setConsequences] = useState<Consequence[]>([]);
  const [decision, setDecision] = useState("");

  return (
    <DecisionTree
      decision={decision}
      consequences={consequences}
    />
  );
}
```

## Estructura del árbol

```
         [Decisión del usuario]
         (Nodo raíz azul)
                |
    ┌───┬───┬───┼───┬───┬───┬───┬───┬───┐
    │   │   │   │   │   │   │   │   │   │
   [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]
   Consecuencias con colores según probabilidad
```

## Interacción

1. **Click en nodo raíz**: Cierra el panel de detalles
2. **Click en consecuencia**: Abre panel lateral con detalles completos
3. **Controles**: Zoom in/out, fit view, lock/unlock
4. **Minimap**: Vista general del árbol completo
