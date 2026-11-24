import { useState } from "react";
import DataTable from "react-data-table-component";
import toast from "react-hot-toast";

import { useAuth } from "../../../context/AuthContext";
import { borrarVentasPrueba } from "../../../services/api";
import { getToken } from "../../../utils/auth";
import { mensajeError } from "../../../utils/formato";

import LoadingModal from "../../../components/Loading/LoadingModal";
import ConfirmDeleteModal from "../../../components/modal/ConfirmDeleteModal";
import UnidadMedidaModal from "../../../components/modal/UnidadMedidaModal";
import { useUnidadMedida } from "../../../hooks/configuracion/useUnidadMedidaHook.ts";
import { UnidadMedidaInterface } from "../../../types/interfaces.ts";

export default function UnidadMedidaConfig() {
    const {
        filteredData,
        loading,
        filterText,
        setFilterText,
        isCreateModalOpen,
        setIsCreateModalOpen,
        isEditModalOpen,
        setIsEditModalOpen,
        selectedUnidad,
        setSelectedUnidad,
        isCreating,
        isUpdating,
        handleCreate,
        handleUpdate,
        handleEdit,
        borrando,
        setBorrando,
        isDeleting,
        handleDelete,
    } = useUnidadMedida();

    // TEMPORAL (pruebas con el cliente): botón «Borrar Ventas». Quitar junto con su ruta en la API.
    const { hasRole } = useAuth();
    const [borrarVentasAbierto, setBorrarVentasAbierto] = useState(false);
    const [textoConfirmacion, setTextoConfirmacion] = useState("");
    const [borrandoVentas, setBorrandoVentas] = useState(false);

    const cerrarBorrarVentas = () => {
        setBorrarVentasAbierto(false);
        setTextoConfirmacion("");
    };

    const handleBorrarVentas = async () => {
        const token = getToken();
        if (!token) return;
        setBorrandoVentas(true);
        try {
            const r = await borrarVentasPrueba(token);
            toast.success(r.message, { duration: 6000 });
            cerrarBorrarVentas();
            // La caja abierta y los contadores quedan en memoria: se recarga para que todo empiece de cero
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) {
            toast.error(mensajeError(e, "No se pudieron borrar las ventas"));
        } finally {
            setBorrandoVentas(false);
        }
    };

    const columns = [
        {
            name: "ID",
            selector: (row: UnidadMedidaInterface) => row.id,
            sortable: true,
            width: "80px",
        },
        {
            name: "Nombre",
            selector: (row: UnidadMedidaInterface) => row.nombre,
            sortable: true,
        },
        {
            name: "Abrev.",
            width: "100px",
            selector: (row: UnidadMedidaInterface) => row.abreviatura ?? "—",
        },
        {
            name: "Tipo",
            width: "120px",
            sortable: true,
            selector: (row: UnidadMedidaInterface) => ({ unidad: "Por unidad", masa: "Peso", volumen: "Volumen" })[row.tipo],
        },
        {
            name: "Equivalencia",
            width: "200px",
            cell: (row: UnidadMedidaInterface) => (
                <span className="text-sm text-gray-600">
                    1 {row.abreviatura ?? row.nombre} = {Number(row.factor_base).toLocaleString("en-US", { maximumFractionDigits: 6 })}{" "}
                    {({ unidad: "u", masa: "g", volumen: "ml" })[row.tipo]}
                </span>
            ),
        },
        {
            name: "Estado",
            width: "120px",
            sortable: true,
            cell: (row: UnidadMedidaInterface) => (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    row.estado ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                    {row.estado ? "Activo" : "Inactivo"}
                </span>
            ),
        },
        {
            name: "Acciones",
            width: "200px",
            cell: (row: UnidadMedidaInterface) => (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => handleEdit(row)}
                        className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                    >
                        Editar
                    </button>
                    {/* Solo si nada la usa (productos, recetas, compras, extras); si no, se desactiva */}
                    {!row.usada && (
                        <button
                            onClick={() => setBorrando(row)}
                            className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition"
                        >
                            Borrar
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <LoadingModal isOpen={loading} text="Cargando unidades de medida..." />

            <UnidadMedidaModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={handleCreate}
                isLoading={isCreating}
            />

            {selectedUnidad && (
                <UnidadMedidaModal
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedUnidad(null);
                    }}
                    onConfirm={(data) => handleUpdate(selectedUnidad.id, data)}
                    isLoading={isUpdating}
                    unidad={selectedUnidad}
                />
            )}

            <ConfirmDeleteModal
                isOpen={!!borrando}
                onClose={() => setBorrando(null)}
                onConfirm={handleDelete}
                isDeleting={isDeleting}
                title="Borrar unidad de medida"
                description="Nada la usa. Se borra definitivamente."
                itemName={borrando?.nombre ?? ""}
            />

            {borrarVentasAbierto && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                        <h2 className="text-lg font-semibold text-red-700">Borrar todas las ventas</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Se borran <strong>todas</strong> las ventas, devoluciones, cuentas por cobrar, cuentas de mesa,
                            comandas, pedidos, todos los turnos y cortes de caja, compras (con cuentas por pagar y pagos a
                            proveedores), producción, mermas y gastos. El inventario se ajusta como si no hubieran pasado.
                            Productos, recetas, clientes y proveedores se conservan.
                        </p>
                        <p className="mt-2 text-sm font-medium text-red-600">No se puede deshacer.</p>
                        <label className="mt-4 block text-sm text-gray-700">
                            Escribe <strong>BORRAR</strong> para confirmar
                            <input
                                type="text"
                                value={textoConfirmacion}
                                onChange={(e) => setTextoConfirmacion(e.target.value)}
                                className="mt-1 h-[42px] w-full rounded-lg border border-gray-300 px-3 text-sm focus:border-red-400 focus:outline-none"
                                autoFocus
                            />
                        </label>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                onClick={cerrarBorrarVentas}
                                disabled={borrandoVentas}
                                className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBorrarVentas}
                                disabled={textoConfirmacion !== "BORRAR" || borrandoVentas}
                                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {borrandoVentas ? "Borrando..." : "Borrar Ventas"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                <div className="mb-6">
                    <div className="mb-4 flex items-center gap-3">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition"
                        >
                            + Crear Unidad de Medida
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-800">Unidades de Medida</h1>
                            <p className="text-sm text-gray-500">{filteredData.length} unidades en total</p>
                        </div>
                        {/* TEMPORAL (pruebas con el cliente) */}
                        {hasRole("admin") && (
                            <button
                                onClick={() => setBorrarVentasAbierto(true)}
                                className="ml-auto px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                                Borrar Ventas
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        className="h-[42px] w-[300px] rounded-lg border border-gray-300 px-4 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition"
                    />
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        pagination
                        striped
                        highlightOnHover
                        responsive
                        noDataComponent={
                            <div className="py-6 text-sm text-gray-500">
                                No hay registros para mostrar
                            </div>
                        }
                        paginationComponentOptions={{
                            rowsPerPageText: "Filas por página",
                            rangeSeparatorText: "de",
                            selectAllRowsItem: true,
                            selectAllRowsItemText: "Todos",
                        }}
                    />
                </div>
            </div>
        </>
    );
}